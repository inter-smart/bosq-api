const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const crypto = require("crypto");

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
  static async placeOrder(cartOwner, paymentType = "cod", address = {}) {
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

      const cart = await models.Cart.findOne({
        where: whereClause,
        include: [
          {
            model: models.CartItems,
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
                attributes: ["id", "sku", "price", "media_path", "stock"],
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

      // Create the order
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
      if (cartBillingAddress) {
        const billingAddress = await models.OrderAddress.create(
          {
            order_id: order.id,
            address_type: "billing",
            name: cartBillingAddress.name,
            company_name: cartBillingAddress.company_name,
            email: cartBillingAddress.email,
            country_code: cartBillingAddress.country_code || "+91",
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
              country_code: cartShippingAddress.country_code || "+91",
              phone: cartShippingAddress.phone,
              street_address: cartShippingAddress.street_address,
              apartment: cartShippingAddress.apartment || null,
              state_id: cartShippingAddress.state_id || null,
              order_notes: cartShippingAddress.order_notes || null,
            },
            { transaction },
          );
        }
      }

      // Mark cart as ordered and clear items
      await cart.update({ status: "ordered" }, { transaction });
      await models.CartItems.destroy({
        where: { cart_id: cart.id },
        transaction,
      });

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
      for (const item of order.items) {
        await models.ProductVariants.increment("stock", {
          by: item.quantity,
          where: { id: item.variant_id },
          transaction,
        });
      }

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
}

module.exports = OrderService;
