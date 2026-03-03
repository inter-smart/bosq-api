const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { addOrderConfirmationJob } = require("../../../../queues/emailQueue.js");
const Logger = require("../../../../config/logger.js");

const modelsMap = {
  user: {
    model: models.Address,
    field: "user_id",
  },
  guest: {
    model: models.CartAddress,
    field: "session_id",
  },
};

class OrderService {
  /**
   * Generate a unique order ID (e.g., BOSQ-20260209-XXXX)
   */
  static generateOrderId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0");
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `BOSQ-${dateStr}-${suffix}`;
  }

  /**
   * Place a new order from the active cart
   */
  static async placeOrder(cartOwner, paymentType = "cod", address = {}, type = "cart") {
    const transaction = await sequelize.transaction();

    const { type: userType, id: ownerId } = cartOwner;
    const isGuest = userType === "guest";
    const userId = isGuest ? null : ownerId;
    const sessionId = isGuest ? ownerId : null;

    const config = modelsMap[userType];
    const { model: Model, field } = config;

    try {
      const whereClause = isGuest ? { session_id: ownerId, status: "active", user_id: null } : { user_id: ownerId, status: "active" };

      const { billing, shipping } = address;

      if (!billing || !shipping) {
        throw ErrorHandler.createError("Billing and shipping addresses are required", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const cartBillingAddress = await Model.findOne({
        where: { [field]: ownerId, status: "active", address_type: "billing", id: billing },
        transaction,
      });

      const cartShippingAddress = await Model.findOne({
        where: { [field]: ownerId, status: "active", address_type: "shipping", id: shipping },
        transaction,
      });

      if (!cartBillingAddress) {
        throw ErrorHandler.createError("Billing address not found", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const cart = await models.Cart.findOne({
        where: whereClause,
        include: [
          {
            model: models.CartItems,
            as: "items",
            where: type === "buynow" ? { is_buy_now: true } : {},
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "slug"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "price", "media_path", "stock", "title"],
              },
            ],
          },
        ],
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError("Cart not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (!cart.items || cart.items.length === 0) {
        throw ErrorHandler.createError("Cart is empty", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      // Validate stock for all items
      for (const item of cart.items) {
        if (!item.variant) {
          throw ErrorHandler.createError(`Product variant not found for item ${item.id}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }
        if (item.variant.stock < item.quantity) {
          throw ErrorHandler.createError(
            `Insufficient stock for "${item.product?.title || "product"}" (available: ${item.variant.stock}, requested: ${item.quantity})`,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }
      }

      // Create the order record
      const order = await models.Orders.create(
        {
          order_id: this.generateOrderId(),
          user_id: userId,
          session_id: sessionId,
          status: "pending",
          payment_status: "pending",
          payment_type: paymentType,
          subtotal: cart.subtotal,
          discount_total: cart.discount_total,
          tax_total: cart.tax_total,
          grand_total: cart.grand_total,
        },
        { transaction },
      );

      // Create order items and reduce stock
      for (const item of cart.items) {
        await models.OrderItem.create(
          {
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
            discount_amount: item.discount_amount,
          },
          { transaction },
        );

        // Reduce variant stock
        await models.ProductVariants.update({ stock: item.variant.stock - item.quantity }, { where: { id: item.variant_id }, transaction });
      }

      // Create order addresses (billing + shipping)
      await models.OrderAddress.create(
        {
          order_id: order.id,
          address_type: "billing",
          name: cartBillingAddress.name,
          company_name: cartBillingAddress.company_name,
          email: cartBillingAddress.email,
          country_code: cartBillingAddress.country_code || "+971",
          phone: cartBillingAddress.phone,
          street_address: cartBillingAddress.street_address,
          apartment: cartBillingAddress.apartment || null,
          state_id: cartBillingAddress.state_id || null,
          order_notes: cartBillingAddress.order_notes || null,
        },
        { transaction },
      );

      if (cartShippingAddress) {
        await models.OrderAddress.create(
          {
            order_id: order.id,
            address_type: "shipping",
            name: cartShippingAddress.name,
            company_name: cartShippingAddress.company_name,
            email: cartShippingAddress.email,
            country_code: cartShippingAddress.country_code || "+971",
            phone: cartShippingAddress.phone,
            street_address: cartShippingAddress.street_address,
            apartment: cartShippingAddress.apartment || null,
            state_id: cartShippingAddress.state_id || null,
            order_notes: cartShippingAddress.order_notes || null,
          },
          { transaction },
        );
      }

      // Mark cart as ordered and clear items
      if (type === "cart") {
        await cart.update({ status: "ordered" }, { transaction });
      }

      const cartItemsWhere = { cart_id: cart.id };
      if (type === "buynow") {
        cartItemsWhere.is_buy_now = true;
      }

      const deletedCount = await models.CartItems.destroy({ where: cartItemsWhere, transaction, force: true });

      if (deletedCount > 0) {
        console.log(`✅ CartItems deleted successfully. Count: ${deletedCount}`);
      } else {
        console.warn("⚠️ No CartItems found to delete.");
      }

      await transaction.commit();
      return await this.getOrderById(userId, sessionId, order.id);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmationEmail(orderId) {
    try {
      const order = await models.Orders.findOne({
        where: { id: orderId },
        include: [
          {
            model: models.OrderItem,
            as: "items",
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "slug"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "price", "media_path", "stock", "title"],
              },
            ],
          },
          {
            model: models.OrderAddress,
            as: "addresses",
          },
        ],
      });

      if (!order) {
        Logger.error(`Order not found for email confirmation: ${orderId}`);
        return;
      }

      const billingAddress = order.addresses.find((a) => a.address_type === "billing");
      const shippingAddress = order.addresses.find((a) => a.address_type === "shipping");

      if (!billingAddress) {
        Logger.error(`Billing address not found for order email confirmation: ${orderId}`);
        return;
      }

      const [billingState, shippingState] = await Promise.all([
        billingAddress.state_id ? models.State.findByPk(billingAddress.state_id, { attributes: ["name"] }) : null,
        shippingAddress?.state_id ? models.State.findByPk(shippingAddress.state_id, { attributes: ["name"] }) : null,
      ]);

      await addOrderConfirmationJob({
        orderId: order.id,
        orderCode: order.order_id,
        email: billingAddress.email,
        name: billingAddress.name,
        paymentType: order.payment_type,
        subtotal: order.subtotal,
        discount_total: order.discount_total,
        tax_total: order.tax_total,
        grand_total: order.grand_total,
        estDelivery: order.est_delivery_details || null,
        billingAddress: {
          street_address: billingAddress.street_address,
          apartment: billingAddress.apartment || null,
          state_name: billingState?.name || null,
          country: "UAE",
        },
        shippingAddress: shippingAddress
          ? {
            street_address: shippingAddress.street_address,
            apartment: shippingAddress.apartment || null,
            state_name: shippingState?.name || null,
            country: "UAE",
          }
          : null,
        items: order.items.map((item) => ({
          title: item.variant?.title || item.product?.title || "Product",
          sku: item.variant?.sku || "",
          quantity: item.quantity,
          price: item.price,
          line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
          image: generateImageUrl(item.variant?.media_path) || null,
        })),
      });

      Logger.info(`Order confirmation email enqueued for order ${order.order_id}`);
    } catch (err) {
      Logger.error(`Failed to enqueue order confirmation email for order ${orderId}: ${err.message}`);
    }
  }

  /**
   * Get all orders for a user
   */
  static async getOrders(userId, sessionId, { page = 1, limit = 10 } = {}) {
    const whereClause = userId ? { user_id: userId } : { session_id: sessionId, user_id: null };

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await models.Orders.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.OrderItem,
          as: "items",
          include: [
            {
              model: models.ProductBase,
              as: "product",
              attributes: ["id", "title", "slug"],
            },
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title", "title_ar"],
            },
          ],
        },
        {
          model: models.OrderAddress,
          as: "addresses",
          include: [
            {
              model: models.State,
              as: "state",
              attributes: ["id", "name", "slug"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return {
      orders: orders.map((order) => this.formatOrder(order)),
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get a single order by ID
   */
  static async getOrderById(userId, sessionId, orderId) {
    const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

    const order = await models.Orders.findOne({
      where: whereClause,
      include: [
        {
          model: models.OrderItem,
          as: "items",
          include: [
            {
              model: models.ProductBase,
              as: "product",
              attributes: ["id", "title", "slug"],
            },
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title", "title_ar"],
            },
          ],
        },
        {
          model: models.OrderAddress,
          as: "addresses",
          include: [
            {
              model: models.State,
              as: "state",
              attributes: ["id", "name", "slug"],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw ErrorHandler.createError("Order not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
    }

    return this.formatOrder(order);
  }

  /**
   * Cancel an order (only pending orders can be cancelled)
   */
  static async cancelOrder(userId, sessionId, orderId) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

      const order = await models.Orders.findOne({
        where: whereClause,
        include: [
          {
            model: models.OrderItem,
            as: "items",
          },
        ],
        transaction,
      });

      if (!order) {
        throw ErrorHandler.createError("Order not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (order.status !== "pending") {
        throw ErrorHandler.createError(
          `Cannot cancel order with status "${order.status}". Only pending orders can be cancelled`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      // Restore stock for each order item
      await this.revertOrderStock(order.id, transaction);

      await order.update({ status: "cancelled" }, { transaction });

      await transaction.commit();

      return await this.getOrderById(userId, sessionId, orderId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Reorder — copy items from an existing order back into the active cart
   */
  static async reorderOrder(userId, sessionId, orderId) {
    const CartService = require("./cartService.js");

    const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

    const order = await models.Orders.findOne({
      where: whereClause,
      include: [{ model: models.OrderItem, as: "items" }],
    });

    if (!order) {
      throw ErrorHandler.createError("Order not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
    }

    for (const item of order.items) {
      await CartService.addItem(userId, sessionId, item.variant_id, item.quantity);
    }

    return CartService.getCart(userId, sessionId);
  }

  /**
   * Format order for response
   */
  static formatOrder(order) {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsCount = order.items.length;

    // Separate billing and shipping addresses
    const addresses = order.addresses || [];
    const billingAddress = addresses.find((a) => a.address_type === "billing") || null;
    const shippingAddress = addresses.find((a) => a.address_type === "shipping") || null;

    return {
      id: order.id,
      order_id: order.order_id,
      status: this?.formatEnums(order.status),
      payment_status: this?.formatEnums(order.payment_status),
      payment_type: order.payment_type,
      est_delivery_details: order?.status == "delivered" ? "Delivered" : order.est_delivery_details,
      items: order.items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
        discount_amount: item.discount_amount,
        line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
        product: item.product,
        variant: item.variant
          ? {
            ...item.variant.toJSON(),
            media_path: generateImageUrl(item.variant.media_path),
          }
          : null,
      })),
      billing_address: billingAddress ? this.formatAddress(billingAddress) : null,
      shipping_address: shippingAddress ? this.formatAddress(shippingAddress) : null,
      subtotal: order.subtotal,
      discount_total: order.discount_total,
      tax_total: order.tax_total,
      grand_total: order.grand_total,
      item_count: itemCount,
      items_count: itemsCount,
      createdAt: this.formatDate(order.createdAt),
    };
  }

  static formatAddress = (item) => {
    const parts = [item?.street_address, item?.apartment, item?.state?.name, item?.state?.country?.name].filter(Boolean);

    return parts.join(", ");
  };

  static formatEnums(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  static formatDate(date) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /**
   * Update payment status and optionally store Network Gateway transaction details.
   *
   * @param {number} orderId
   * @param {string} paymentStatus         - "pending" | "paid" | "failed"
   * @param {object} [networkFields]       - Optional Network Gateway fields to persist
   * @param {string} [networkFields.network_transaction_id]
   * @param {string} [networkFields.order_reference]
   * @param {string} [networkFields.payment_method]
   * @param {object} [networkFields.gateway_response]
   * @param {object} [transaction]         - Optional Sequelize transaction to enlist in
   */
  static async updatePaymentStatus(orderId, paymentStatus, networkFields = null, transaction = null) {
    const updateFields = { payment_status: paymentStatus };
    if (networkFields) {
      const { network_transaction_id, order_reference, payment_method, gateway_response } = networkFields;
      if (network_transaction_id) updateFields.network_transaction_id = network_transaction_id;
      if (order_reference) updateFields.order_reference = order_reference;
      if (payment_method) updateFields.payment_method = payment_method;
      if (gateway_response) updateFields.gateway_response = gateway_response;
    }
    const opts = { where: { id: orderId } };
    if (transaction) opts.transaction = transaction;
    await models.Orders.update(updateFields, opts);
  }

  /**
   * Revert stock for all items in an order
   *
   * @param {number} orderId
   * @param {object} transaction - Sequelize transaction
   */
  static async revertOrderStock(orderId, transaction) {
    const orderItems = await models.OrderItem.findAll({
      where: { order_id: orderId },
      transaction,
    });

    for (const item of orderItems) {
      await models.ProductVariants.increment("stock", {
        by: item.quantity,
        where: { id: item.variant_id },
        transaction,
      });
    }

    Logger.info(`Stock reverted for order ${orderId}`);
  }
}

module.exports = OrderService;
