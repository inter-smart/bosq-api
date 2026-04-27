const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require("../traits/constants.js");
const CheckOutService = require("./CheckOutService.js");
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
    const dateStr = date.getFullYear().toString() + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0");
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `BOSQ-${dateStr}-${suffix}`;
  }

  /**
   * Place a new order from the active cart
   */
  static async placeOrder(cartOwner, paymentType = "cod", address = {}, type = "cart", couponCode = null) {
    const transaction = await sequelize.transaction();

    const { type: userType, id: ownerId } = cartOwner;
    const isGuest = userType === "guest";
    const userId = isGuest ? null : ownerId;
    const sessionId = isGuest ? ownerId : null;

    const config = modelsMap[userType];
    const { model: Model, field } = config;

    try {
      const whereClause = isGuest ? { session_id: ownerId, status: "active", user_id: null, type } : { user_id: ownerId, status: "active", type };

      const { billing, shipping } = address;

      if (!billing || !shipping) {
        throw ErrorHandler.createError("Billing and shipping addresses are required", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
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
        throw ErrorHandler.createError("Billing address not found", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

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
                attributes: ["id", "sku", "price", "media_path", "stock", "title", "product_model_id"],
                include: [
                  {
                    model: models.ProductCategory,
                    as: "categories",
                    attributes: ["id"],
                    through: { attributes: [] },
                    required: false,
                  },
                  {
                    model: models.ProductModels,
                    as: "productModel",
                    attributes: ["id"],
                    include: [
                      {
                        model: models.ProductBase,
                        as: "product",
                        attributes: ["id"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.CART_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (!cart.items || cart.items.length === 0) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.CART_IS_EMPTY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      // Validate stock for all items
      for (const item of cart.items) {
        if (!item.variant) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.PRODUCT_VARIANT_NOT_FOUND, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }
        if (item.variant.stock === null || item.variant.stock === undefined) {
          // null stock means no stock tracking for this variant — allow through
          continue;
        }
        if (item.variant.stock < item.quantity) {
          const productTitle = item.product?.title || item.product?.title_ar || "";
          throw ErrorHandler.createError(
            {
              en: productTitle
                ? `"${productTitle}" has only ${item.variant.stock} unit(s) left. Please update your cart.`
                : `One of your items has only ${item.variant.stock} unit(s) left. Please update your cart.`,
              ar: productTitle
                ? `المنتج "${productTitle}" متوفر بـ ${item.variant.stock} وحدة فقط. يرجى تحديث سلة التسوق.`
                : `أحد منتجاتك متوفر بـ ${item.variant.stock} وحدة فقط. يرجى تحديث سلة التسوق.`,
            },
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.STOCK_VALIDATION_ERROR,
          );
        }
      }

      // Apply coupon if provided — re-validate and persist to DB within this transaction
      let appliedCoupon = null;
      let orderDiscountTotal = parseFloat(cart.discount_total);
      let orderGrandTotal = parseFloat(cart.grand_total);
      let itemDiscounts = null;

      console.log("CPN CODE", couponCode);

      if (couponCode) {
        const coupon = await models.Coupons.findOne({
          where: {
            code: couponCode,
            status: true,
            start_at: { [Op.lte]: new Date() },
            end_at: { [Op.gte]: new Date() },
          },
          transaction,
        });

        if (!coupon) {
          throw ErrorHandler.createError("Coupon is invalid or expired", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }

        if (coupon.min_order_amount && parseFloat(cart.subtotal) < parseFloat(coupon.min_order_amount)) {
          throw ErrorHandler.createError(
            `Minimum order amount of ${coupon.min_order_amount} required for this coupon`,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }

        const totalUsageCount = await models.CouponUsage.count({ where: { coupon_id: coupon.id }, transaction });
        if (totalUsageCount >= coupon.usage_limit_total) {
          throw ErrorHandler.createError("Coupon usage limit has been reached", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }

        if (userId) {
          const userUsageCount = await models.CouponUsage.count({ where: { coupon_id: coupon.id, user_id: userId }, transaction });
          if (userUsageCount >= coupon.usage_limit_per_user) {
            throw ErrorHandler.createError(
              "You have already used this coupon the maximum number of times",
              HTTP_STATUS.BAD_REQUEST,
              ERROR_CODES.VALIDATION_ERROR,
            );
          }
        }

        if (coupon.scope_type !== "common" && !CheckOutService.isCouponApplicableToCart(coupon, cart.items)) {
          throw ErrorHandler.createError("Coupon is not applicable to items in your cart", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
        }

        const result = await CheckOutService.couponWiseUpdates(coupon, cart, transaction, true);
        appliedCoupon = coupon;
        orderDiscountTotal = result.newDiscountTotal;
        orderGrandTotal = result.newGrandTotal;
        itemDiscounts = result.itemDiscounts;
      }

      const order = await models.Orders.create(
        {
          order_id: this.generateOrderId(),
          user_id: userId,
          session_id: sessionId,
          status: paymentType == "cod" ? "confirmed" : "pending",
          payment_status: "pending",
          payment_type: paymentType,
          subtotal: cart.subtotal,
          discount_total: orderDiscountTotal.toFixed(2),
          tax_total: cart.tax_total,
          grand_total: Math.max(0, orderGrandTotal).toFixed(2),
        },
        { transaction },
      );

      for (const item of cart.items) {
        const itemDiscount = itemDiscounts?.get(item.id) ?? parseFloat(item.discount_amount ?? 0);

        await models.OrderItem.create(
          {
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
            discount_amount: itemDiscount.toFixed(2),
          },
          { transaction },
        );

        // Reduce variant stock
        await models.ProductVariants.update({ stock: item.variant.stock - item.quantity }, { where: { id: item.variant_id }, transaction });
      }

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

      // Record coupon usage if a coupon was applied
      const couponForUsage = appliedCoupon ?? (cart.coupon_id ? { id: cart.coupon_id, code: cart.applied_coupon_code } : null);
      console.log("CPN", couponForUsage);
      if (couponForUsage) {
        await models.CouponUsage.create(
          {
            coupon_id: couponForUsage.id,
            coupon_code: couponForUsage.code,
            user_id: userId,
            order_id: order.id,
            discount_amount: appliedCoupon ? orderDiscountTotal.toFixed(2) : cart.discount_total,
            used_at: new Date(),
          },
          { transaction },
        );
      }

      await cart.update({ status: "ordered" }, { transaction });

      const cartItemsWhere = { cart_id: cart.id };

      const deletedCount = await models.CartItems.destroy({
        where: cartItemsWhere,
        transaction,
        force: true,
      });

      if (type == "cart") {
        const activeBuyNowCart = await models.Cart.findOne({
          where: userId
            ? { user_id: userId, status: "active", type: "buynow" }
            : { session_id: sessionId, user_id: null, status: "active", type: "buynow" },
          transaction,
        });

        if (activeBuyNowCart) {
          await activeBuyNowCart.destroy({ force: true, transaction });
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ CartItems deleted successfully. Count: ${deletedCount}`);
      } else {
        console.warn("⚠️ No CartItems found to delete.");
      }

      await transaction.commit();

      // Send order confirmation email

      if (paymentType === "cod") {
        this.sendOrderConfirmationEmail(order.id).catch((err) => Logger.error(`Order confirmation email failed: ${err.message}`));
      }

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

      const user = order.user_id
        ? await models.Users.findByPk(order.user_id, {
            attributes: ["id", "name", "email"],
          })
        : null;

      const billingAddress = order.addresses.find((a) => a.address_type === "billing");

      const shippingAddress = order.addresses.find((a) => a.address_type === "shipping");

      if (!billingAddress) {
        Logger.error(`Billing address not found for order email confirmation: ${orderId}`);
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

      Logger.info(`Order confirmation email enqueued for order ${order.order_id}`);
    } catch (err) {
      Logger.error(`Failed to enqueue order confirmation email for order ${orderId}: ${err.message}`);
    }
  }

  /**
   * Get all orders for a user (raw SQL — single query with window count + JSON_AGG)
   */
  static async getOrders(userId, sessionId, { page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;

    const whereClause = userId ? `o.user_id = :ownerId` : `o.session_id = :ownerId AND o.user_id IS NULL`;

    const sql = `
      SELECT
        o.id,
        o.order_id,
        o.order_url,
        o.awb_number,
        o.partner_name,
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
               'final_amount',     ((oi.price * oi.quantity) - COALESCE(oi.discount_amount, 0))::TEXT,
  'is_coupon_applied', COALESCE(oi.discount_amount, 0) <> 0,
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
        AND oi.status = 'ordered' 
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
   * Get all cancelled orders for a user (raw SQL — single query with window count + JSON_AGG)
   */

  static async getCancelledOrders(userId, sessionId, locale = "en", { page = 1, limit = 12 } = {}) {
    const offset = (page - 1) * limit;

    const whereClause = userId ? `o.user_id = :ownerId` : `o.session_id = :ownerId AND o.user_id IS NULL`;

    const sql = `
    SELECT
      oi.id AS item_id,
      o.id AS order_id,
      o.order_id AS order_number,
      oi.quantity,
      oi.discount_amount,
      COALESCE(oi.discount_amount, 0) <> 0 AS is_coupon_applied,
      (oi.price * oi.quantity)::TEXT AS formatted_total,
      (oi.price * oi.quantity - COALESCE(oi.discount_amount, 0))::TEXT AS final_amount,
      o."createdAt" AS formatted_cancelled_date,
      COALESCE(pv.media_path, '/images/cart-product-1.png') AS media_path,
      COALESCE(pv.title, '') AS title,
      COALESCE(pv.title_ar, '') AS title_ar,
      COUNT(*) OVER() AS total_count
    FROM orders o
    INNER JOIN order_items oi
      ON oi.order_id = o.id
      AND oi.status = 'cancelled'
    LEFT JOIN product_variants pv
      ON pv.id = oi.variant_id
    WHERE ${whereClause}
    ORDER BY o."createdAt" DESC
    LIMIT :limit OFFSET :offset
  `;

    const rows = await sequelize.query(sql, {
      replacements: {
        ownerId: userId ?? sessionId,
        limit,
        offset,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

    return {
      orders: rows.map((row) => ({
        order_id: row.order_id,
        order_number: row.order_number,
        name: locale === "ar" ? row.title_ar : row.title,
        quantity: row.quantity,
        discount_amount: row.discount_amount,
        final_amount: row.final_amount,
        formatted_total: row.formatted_total,
        formatted_cancelled_date: this.formatDate(row.formatted_cancelled_date),
        cancelledReason: "",
        media: {
          path: generateImageUrl(row.media_path),
          alt: row.title,
        },
        actions: {
          can_reorder: true,
        },
      })),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
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
  static async cancelOrder(userId, sessionId, orderId, orderItemId = null) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

      const order = await models.Orders.findOne({
        where: whereClause,
        transaction,
      });

      if (!order) {
        throw ErrorHandler.createError("Order not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      // if (order.status !== "pending") {
      //   throw ErrorHandler.createError(
      //     `Cannot cancel order with status "${order.status}". Only pending orders can be cancelled`,
      //     HTTP_STATUS.BAD_REQUEST,
      //     ERROR_CODES.VALIDATION_ERROR,
      //   );
      // }

      const orderItem = await models.OrderItem.findOne({
        where: {
          order_id: order.id,
          ...(orderItemId ? { id: orderItemId } : {}),
        },
        transaction,
      });

      await models.OrderItem.update(
        { status: "cancelled" },
        {
          where: {
            order_id: order.id,
            ...(orderItemId ? { id: orderItemId } : {}),
          },
          transaction,
        },
      );

      console.log(JSON.stringify(orderItem, null, 2));

      await this.cancelAndRevertStock(order, orderItem, transaction);

      await transaction.commit();

      // Send cancellation status email (fire-and-forget)
      // this.sendOrderStatusEmail(order.id, "cancelled").catch((err) => Logger.error(`Order cancellation email failed: ${err.message}`));

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

      const billingAddress = order.addresses?.find((a) => a.address_type === "billing");
      const shippingAddress = order.addresses?.find((a) => a.address_type === "shipping");

      const customerEmail = order.user?.email || billingAddress?.email;
      const customerName = order.user?.name || billingAddress?.name || "Customer";

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

      Logger.info(`Order status email (${status}) sent for order ${order.order_id}`);
    } catch (err) {
      Logger.error(`Failed to send order status email (${status}) for order ${orderId}: ${err.message}`);
    }
  }

  /**
   * Reorder — copy items from an existing order back into the active cart
   */
  static async reorderOrder(userId, sessionId, orderId, variantId = null, quantity = null) {
    const CartService = require("./cartService.js");

    const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

    const order = await models.Orders.findOne({
      where: whereClause,
      include: [{ model: models.OrderItem, as: "items" }],
    });

    if (!order) {
      throw ErrorHandler.createError("Order not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
    }

    if (variantId) {
      const item = order.items.find((i) => i.variant_id === variantId);
      if (!item) {
        throw ErrorHandler.createError("Item not found in order", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }
      await CartService.addItem(userId, sessionId, item.variant_id, quantity ?? item.quantity);
    } else {
      for (const item of order.items) {
        await CartService.addItem(userId, sessionId, item.variant_id, item.quantity);
      }
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
              media_path: generateImageUrl(item?.variant?.media_path),
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
      showCancelButton: Date.now() - new Date(order.createdAt).getTime() < 5 * 60 * 60 * 1000,
    };
  }

  /**
   * Format a raw SQL order row for response (used by getOrders)
   */
  static formatRawOrder(row) {
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const formatAddr = (addr) => (addr ? [addr.street_address, addr.apartment, addr.state_name].filter(Boolean).join(", ") : null);

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
      order_url: row.order_url,
      awb_number: row.awb_number,
      partner_name: row.partner_name,
      status: this.formatEnums(row.status),
      payment_status: this.formatEnums(row.payment_status),
      payment_type: row.payment_type,
      est_delivery_details: row.status === "delivered" ? "Delivered" : row.est_delivery_details,
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
      showCancelButton: Date.now() - new Date(row.createdAt).getTime() < FIVE_HOURS_MS,
      showReturnButton: row.status === "delivered" && Date.now() - new Date(row.createdAt).getTime() < SEVEN_DAYS_MS,
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
   * @param {string} paymentStatus         - "pending" | "paid" | "failed" | "refunded"
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
  static async revertOrderStock(orderId, orderItemId, transaction) {
    if (orderId) {
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
    } else if (orderItemId) {
      const item = await models.OrderItem.findByPk(orderItemId, { transaction });
      if (item) {
        await models.ProductVariants.increment("stock", {
          by: item.quantity,
          where: { id: item.variant_id },
          transaction,
        });
      }
    }

    Logger.info(`Stock reverted for order ${orderId}`);
  }

  static async cancelAndRevertStock(order, orderItem, transaction) {
    const orderItemAmount = orderItem ? parseFloat(orderItem.quantity * orderItem.price) - parseFloat(orderItem.discount_amount || "0") : 0;
    const currentSubTotal = parseFloat(order.subtotal) || 0;
    const currentGrandTotal = parseFloat(order.grand_total) || 0;
    const currentDiscountTotal = parseFloat(order.discount_total) || 0;

    const newSubTotal = Math.max(0, currentSubTotal - orderItemAmount);
    const newGrandTotal = Math.max(0, currentGrandTotal - orderItemAmount);
    const newDiscountTotal = Math.max(0, currentDiscountTotal - parseFloat(orderItem.discount_amount || "0"));

    console.log(JSON.stringify(orderItem, null, 2));

    await Promise.all([
      models.Orders.update(
        { subtotal: newSubTotal.toFixed(2), grand_total: newGrandTotal.toFixed(2), discount_total: newDiscountTotal.toFixed(2) },
        { where: { id: order.id }, transaction },
      ),
      models.ProductVariants.increment("stock", {
        by: orderItem.quantity,
        where: { id: orderItem.variant_id },
        transaction,
      }),
    ]);
  }
}

module.exports = OrderService;
