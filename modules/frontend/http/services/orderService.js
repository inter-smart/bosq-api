const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { addOrderConfirmationJob } = require("../../../../queues/emailQueue.js");
const Logger = require("../../../../config/logger.js");
const EmailService = require("../../../../services/EmailService");

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
    const dateStr =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `BOSQ-${dateStr}-${suffix}`;
  }

  /**
   * Place a new order from the active cart
   */
  static async placeOrder(
    cartOwner,
    paymentType = "cod",
    address = {},
    type = "cart",
  ) {
    const transaction = await sequelize.transaction();

    const { type: userType, id: ownerId } = cartOwner;
    const isGuest = userType === "guest";
    const userId = isGuest ? null : ownerId;
    const sessionId = isGuest ? ownerId : null;

    const config = modelsMap[userType];
    const { model: Model, field } = config;

    try {
      const whereClause = isGuest
        ? { session_id: ownerId, status: "active", user_id: null }
        : { user_id: ownerId, status: "active" };

      const { billing, shipping } = address;

      if (!billing || !shipping) {
        throw ErrorHandler.createError(
          "Billing and shipping addresses are required",
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const isSameAddress = billing === shipping;

      const cartBillingAddress = await Model.findOne({
        where: {
          [field]: ownerId,
          status: "active",
          ...(isSameAddress ? {} : { address_type: "billing" }),
          id: billing,
        },
        transaction,
      });

      const cartShippingAddress = await Model.findOne({
        where: {
          [field]: ownerId,
          status: "active",
          address_type: "shipping",
          id: shipping,
        },
        transaction,
      });

      if (!cartBillingAddress) {
        throw ErrorHandler.createError(
          "Billing address not found",
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
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
                attributes: [
                  "id",
                  "sku",
                  "price",
                  "media_path",
                  "stock",
                  "title",
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError(
          "Cart not found",
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND_ERROR,
        );
      }

      if (!cart.items || cart.items.length === 0) {
        throw ErrorHandler.createError(
          "Cart is empty",
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      // Validate stock for all items
      for (const item of cart.items) {
        if (!item.variant) {
          throw ErrorHandler.createError(
            `Product variant not found for item ${item.id}`,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
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
        await models.ProductVariants.update(
          { stock: item.variant.stock - item.quantity },
          { where: { id: item.variant_id }, transaction },
        );
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

      const deletedCount = await models.CartItems.destroy({
        where: cartItemsWhere,
        transaction,
        force: true,
      });

      if (deletedCount > 0) {
        console.log(
          `✅ CartItems deleted successfully. Count: ${deletedCount}`,
        );
      } else {
        console.warn("⚠️ No CartItems found to delete.");
      }

      await transaction.commit();

      // Send order confirmation email
      this.sendOrderConfirmationEmail(order.id).catch((err) =>
        Logger.error(`Order confirmation email failed: ${err.message}`),
      );

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
                attributes: [
                  "id",
                  "sku",
                  "price",
                  "media_path",
                  "stock",
                  "title",
                ],
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

      const user = order.user_id
        ? await models.Users.findByPk(order.user_id, {
            attributes: ["id", "name", "email"],
          })
        : null;

      const billingAddress = order.addresses.find(
        (a) => a.address_type === "billing",
      );

      const shippingAddress = order.addresses.find(
        (a) => a.address_type === "shipping",
      );

      if (!billingAddress) {
        Logger.error(
          `Billing address not found for order email confirmation: ${orderId}`,
        );
        return;
      }

      const customerEmail = user?.email || order.email || billingAddress.email;

      const customerName = user?.name || billingAddress.name || "Customer";

      if (!customerEmail) {
        Logger.error(`No valid email found for order confirmation: ${orderId}`);
        return;
      }

      const [billingState, shippingState] = await Promise.all([
        billingAddress.state_id
          ? models.State.findByPk(billingAddress.state_id, {
              attributes: ["name"],
            })
          : null,
        shippingAddress?.state_id
          ? models.State.findByPk(shippingAddress.state_id, {
              attributes: ["name"],
            })
          : null,
      ]);

      /**
       * ----------------------------------------
       * Enqueue Email Job
       * ----------------------------------------
       */

      await addOrderConfirmationJob({
        orderId: order.id,
        orderCode: order.order_id,
        email: customerEmail,
        name: customerName,
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

      Logger.info(
        `Order confirmation email enqueued for order ${order.order_id}`,
      );
    } catch (err) {
      Logger.error(
        `Failed to enqueue order confirmation email for order ${orderId}: ${err.message}`,
      );
    }
  }

  /**
   * Get all orders for a user (raw SQL — single query with window count + JSON_AGG)
   */
  static async getOrders(userId, sessionId, { page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;

    const whereClause = userId
      ? `o.user_id = :ownerId`
      : `o.session_id = :ownerId AND o.user_id IS NULL`;

    const sql = `
      SELECT
        o.id,
        o.order_id,
        o.status,
        o.payment_status,
        o.payment_type,
        o.est_delivery_details,
        o.subtotal,
        o.discount_total,
        o.tax_total,
        o.grand_total,
        o."createdAt",
        COUNT(*) OVER() AS total_count,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id',             oi.id,
              'product_id',     oi.product_id,
              'variant_id',     oi.variant_id,
              'quantity',       oi.quantity,
              'price',          oi.price,
              'discount_amount',oi.discount_amount,
              'line_total',     (oi.price * oi.quantity)::TEXT,
              'product',        JSONB_BUILD_OBJECT('id', pb.id, 'title', pb.title, 'slug', pb.slug),
              'variant',        JSONB_BUILD_OBJECT(
                                  'id',        pv.id,
                                  'sku',       pv.sku,
                                  'price',     pv.price,
                                  'media_path',pv.media_path,
                                  'title',     pv.title,
                                  'title_ar',  pv.title_ar
                                )
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items,
        (
          SELECT JSONB_BUILD_OBJECT(
            'street_address', oa_b.street_address,
            'apartment',      oa_b.apartment,
            'state_name',     st_b.name
          )
          FROM order_address oa_b
          LEFT JOIN states st_b ON st_b.id = oa_b.state_id
          WHERE oa_b.order_id = o.id AND oa_b.address_type = 'billing'
          LIMIT 1
        ) AS billing_address,
        (
          SELECT JSONB_BUILD_OBJECT(
            'street_address', oa_s.street_address,
            'apartment',      oa_s.apartment,
            'state_name',     st_s.name
          )
          FROM order_address oa_s
          LEFT JOIN states st_s ON st_s.id = oa_s.state_id
          WHERE oa_s.order_id = o.id AND oa_s.address_type = 'shipping'
          LIMIT 1
        ) AS shipping_address
      FROM orders o
      LEFT JOIN order_items oi
        ON oi.order_id = o.id 
      LEFT JOIN product_base pb
        ON pb.id = oi.product_id 
      LEFT JOIN product_variants pv
        ON pv.id = oi.variant_id 
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o."createdAt" DESC
      LIMIT :limit OFFSET :offset
    `;

    const rows = await sequelize.query(sql, {
      replacements: { ownerId: userId ?? sessionId, limit, offset },
      type: sequelize.QueryTypes.SELECT,
    });

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

    return {
      orders: rows.map((row) => this.formatRawOrder(row)),
      pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single order by ID
   */
  static async getOrderById(userId, sessionId, orderId) {
    const whereClause = userId
      ? { id: orderId, user_id: userId }
      : { id: orderId, session_id: sessionId, user_id: null };

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
              attributes: [
                "id",
                "sku",
                "price",
                "media_path",
                "title",
                "title_ar",
              ],
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
      throw ErrorHandler.createError(
        "Order not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND_ERROR,
      );
    }

    return this.formatOrder(order);
  }

  /**
   * Cancel an order (only pending orders can be cancelled)
   */
  static async cancelOrder(userId, sessionId, orderId) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId
        ? { id: orderId, user_id: userId }
        : { id: orderId, session_id: sessionId, user_id: null };

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
        throw ErrorHandler.createError(
          "Order not found",
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND_ERROR,
        );
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

      // Send cancellation status email (fire-and-forget)
      this.sendOrderStatusEmail(order.id, "cancelled").catch((err) =>
        Logger.error(`Order cancellation email failed: ${err.message}`),
      );

      return await this.getOrderById(userId, sessionId, orderId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Send order status update email (cancelled, returned, etc.)
   */
  static async sendOrderStatusEmail(orderId, status, cancelReason = null) {
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
                attributes: ["id", "title"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "title", "media_path", "price"],
              },
            ],
          },
          { model: models.OrderAddress, as: "addresses" },
          {
            model: models.Users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!order) {
        Logger.error(`Order not found for status email: ${orderId}`);
        return;
      }

      const billingAddress = order.addresses?.find(
        (a) => a.address_type === "billing",
      );
      const shippingAddress = order.addresses?.find(
        (a) => a.address_type === "shipping",
      );

      const customerEmail = order.user?.email || billingAddress?.email;
      const customerName =
        order.user?.name || billingAddress?.name || "Customer";

      if (!customerEmail) {
        Logger.error(`No valid email found for order status email: ${orderId}`);
        return;
      }

      const itemsData = (order.items || []).map((item) => {
        const p = parseFloat(item.price) || 0;
        const q = item.quantity || 1;
        const d = parseFloat(item.discount_amount || "0") || 0;
        return {
          title: item.variant?.title || item.product?.title || "Product",
          sku: item.variant?.sku,
          quantity: q,
          price: String(item.price),
          discount_amount: String(item.discount_amount || "0"),
          line_total: String(p * q - d),
          image: generateImageUrl(item.variant?.media_path) || null,
        };
      });

      await EmailService.sendOrderStatusUpdate(customerEmail, {
        name: customerName,
        orderCode: order.order_id,
        status,
        cancel_reason: cancelReason,
        paymentType: order.payment_type,
        subtotal: order.subtotal,
        discount_total: order.discount_total,
        tax_total: order.tax_total,
        grand_total: order.grand_total,
        estDelivery: order.est_delivery_details,
        items: itemsData,
        billingAddress,
        shippingAddress,
      });

      Logger.info(
        `Order status email (${status}) sent for order ${order.order_id}`,
      );
    } catch (err) {
      Logger.error(
        `Failed to send order status email (${status}) for order ${orderId}: ${err.message}`,
      );
    }
  }

  /**
   * Reorder — copy items from an existing order back into the active cart
   */
  static async reorderOrder(userId, sessionId, orderId) {
    const CartService = require("./cartService.js");

    const whereClause = userId
      ? { id: orderId, user_id: userId }
      : { id: orderId, session_id: sessionId, user_id: null };

    const order = await models.Orders.findOne({
      where: whereClause,
      include: [{ model: models.OrderItem, as: "items" }],
    });

    if (!order) {
      throw ErrorHandler.createError(
        "Order not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND_ERROR,
      );
    }

    for (const item of order.items) {
      await CartService.addItem(
        userId,
        sessionId,
        item.variant_id,
        item.quantity,
      );
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
    const billingAddress =
      addresses.find((a) => a.address_type === "billing") || null;
    const shippingAddress =
      addresses.find((a) => a.address_type === "shipping") || null;

    return {
      id: order.id,
      order_id: order.order_id,
      status: this?.formatEnums(order.status),
      payment_status: this?.formatEnums(order.payment_status),
      payment_type: order.payment_type,
      est_delivery_details:
        order?.status == "delivered" ? "Delivered" : order.est_delivery_details,
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
              media_path: generateImageUrl(item?.variant?.media_path),
            }
          : null,
      })),
      billing_address: billingAddress
        ? this.formatAddress(billingAddress)
        : null,
      shipping_address: shippingAddress
        ? this.formatAddress(shippingAddress)
        : null,
      subtotal: order.subtotal,
      discount_total: order.discount_total,
      tax_total: order.tax_total,
      grand_total: order.grand_total,
      item_count: itemCount,
      items_count: itemsCount,
      createdAt: this.formatDate(order.createdAt),
      showCancelButton:
        Date.now() - new Date(order.createdAt).getTime() < 5 * 60 * 60 * 1000,
    };
  }

  /**
   * Format a raw SQL order row for response (used by getOrders)
   */
  static formatRawOrder(row) {
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

    const formatAddr = (addr) =>
      addr
        ? [addr.street_address, addr.apartment, addr.state_name]
            .filter(Boolean)
            .join(", ")
        : null;

    const items = (row.items || []).map((item) => ({
      ...item,
      line_total: parseFloat(item.line_total).toFixed(2),
      variant: item.variant
        ? {
            ...item.variant,
            media_path: generateImageUrl(item.variant.media_path),
          }
        : null,
    }));

    return {
      id: row.id,
      order_id: row.order_id,
      status: this.formatEnums(row.status),
      payment_status: this.formatEnums(row.payment_status),
      payment_type: row.payment_type,
      est_delivery_details:
        row.status === "delivered" ? "Delivered" : row.est_delivery_details,
      items,
      billing_address: formatAddr(row.billing_address),
      shipping_address: formatAddr(row.shipping_address),
      subtotal: row.subtotal,
      discount_total: row.discount_total,
      tax_total: row.tax_total,
      grand_total: row.grand_total,
      item_count: items.reduce((s, i) => s + i.quantity, 0),
      items_count: items.length,
      createdAt: this.formatDate(row.createdAt),
      showCancelButton:
        Date.now() - new Date(row.createdAt).getTime() < FIVE_HOURS_MS,
    };
  }

  static formatAddress = (item) => {
    const parts = [
      item?.street_address,
      item?.apartment,
      item?.state?.name,
      item?.state?.country?.name,
    ].filter(Boolean);

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
   * @param {string} paymentStatus         - "pending" | "paid" | "failed" | "refunded"
   * @param {object} [networkFields]       - Optional Network Gateway fields to persist
   * @param {string} [networkFields.network_transaction_id]
   * @param {string} [networkFields.order_reference]
   * @param {string} [networkFields.payment_method]
   * @param {object} [networkFields.gateway_response]
   * @param {object} [transaction]         - Optional Sequelize transaction to enlist in
   */
  static async updatePaymentStatus(
    orderId,
    paymentStatus,
    networkFields = null,
    transaction = null,
  ) {
    const updateFields = { payment_status: paymentStatus };
    if (networkFields) {
      const {
        network_transaction_id,
        order_reference,
        payment_method,
        gateway_response,
      } = networkFields;
      if (network_transaction_id)
        updateFields.network_transaction_id = network_transaction_id;
      if (order_reference) updateFields.order_reference = order_reference;
      if (payment_method) updateFields.payment_method = payment_method;
      if (gateway_response) updateFields.gateway_response = gateway_response;
    }

    console.log("Updating payment status with fields:", updateFields);

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
