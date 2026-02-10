const { Op } = require("sequelize");
const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const { buildCheckoutFormPayload } = require("../traits/dataManipulations/address.js");
const ProductServiceHelpers = require("../traits/products.js");

class CheckOutService {
  /**
   * Get or create cart for user/guest
   */
  static async getOrCreateCart(userId, sessionId, transaction = null) {
    const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

    let cart = await models.Cart.findOne({
      where: whereClause,
      transaction,
    });

    if (!cart) {
      console.log("OPERATION ====> NEW CART CREATED");
      cart = await models.Cart.create(
        {
          user_id: userId || null,
          session_id: userId ? null : sessionId,
          status: "active",
          currency: "AED",
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          grand_total: 0,
        },
        { transaction },
      );
    }

    return cart;
  }

  /**
   * Get cart with items
   */
  static async getCartData(userId, sessionId) {
    const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

    console.log(`Fetching cart data for ${userId ? "user" : "guest"} with ID ${userId || sessionId}`);

    const cart = await models.Cart.findOne({
      where: whereClause,
      include: [
        {
          model: models.CartItems,
          as: "items",
          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title"],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return {
        cart: [],
      };
    }

    const priceChanged = await ProductServiceHelpers.syncCartItemPrices(cart);

    if (priceChanged) {
      await cart.reload({
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
      });
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        variant_id: item.variant_id,
        title: item.variant.title,
        slug: item.variant.sku,
        price: item.price,
        media_path: generateImageUrl(item.variant.media_path),
        quantity: item.quantity,
        discount_amount: item.discount_amount,
        line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
        is_sold_out: item.variant ? item.variant.stock < item.quantity : false,
      })),
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      applied_coupon_code: cart.applied_coupon_code,
      item_count: itemCount,
    };
  }

  /**
   * Apply a coupon code to the cart
   */
  static async applyCoupon(userId, couponCode) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Find the active cart
      const whereClause = { user_id: userId, status: "active" };

      const cart = await models.Cart.findOne({
        where: whereClause,
        include: [
          {
            model: models.CartItems,
            as: "items",
            include: [
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "product_model_id"],
              },
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "category_id"],
              },
            ],
          },
        ],
        transaction,
      });

      if (!cart || cart.items.length === 0) {
        throw ErrorHandler.createError("Cart is empty or not found", HTTP_STATUS.BAD_REQUEST);
      }

      // 2. Check if a coupon is already applied
      if (cart.applied_coupon_code) {
        throw ErrorHandler.createError("A coupon is already applied. Remove it first before applying a new one", HTTP_STATUS.BAD_REQUEST);
      }

      // 3. Find and validate the coupon
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
        throw ErrorHandler.createError("Invalid or expired coupon code", HTTP_STATUS.BAD_REQUEST);
      }

      // 4. Check minimum order amount
      const subtotal = parseFloat(cart.subtotal);
      if (subtotal < parseFloat(coupon.min_order_amount)) {
        throw ErrorHandler.createError(`Minimum order amount of ${coupon.min_order_amount} AED is required for this coupon`, HTTP_STATUS.BAD_REQUEST);
      }

      // 5. Check total usage limit
      const totalUsageCount = await models.CouponUsage.count({
        where: { coupon_id: coupon.id },
        transaction,
      });

      if (totalUsageCount >= coupon.usage_limit_total) {
        throw ErrorHandler.createError("This coupon has reached its maximum usage limit", HTTP_STATUS.BAD_REQUEST);
      }

      // 6. Check per-user usage limit (only for logged-in users)
      if (userId) {
        const userUsageCount = await models.CouponUsage.count({
          where: { coupon_id: coupon.id, user_id: userId },
          transaction,
        });

        if (userUsageCount >= coupon.usage_limit_per_user) {
          throw ErrorHandler.createError("You have already used this coupon the maximum number of times", HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 7. Validate scope - check if coupon applies to items in cart
      if (coupon.scope_type !== "common") {
        const isApplicable = this.isCouponApplicableToCart(coupon, cart.items);

        if (!isApplicable) {
          throw ErrorHandler.createError("This coupon is not applicable to the items in your cart", HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 8. Calculate discount amount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
        // Cap at max_discount_amount
        if (discountAmount > parseFloat(coupon.max_discount_amount)) {
          discountAmount = parseFloat(coupon.max_discount_amount);
        }
      } else {
        // flat discount
        discountAmount = parseFloat(coupon.discount_value);
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      // 9. Update cart with coupon
      const currentDiscount = parseFloat(cart.discount_total);
      const newDiscountTotal = currentDiscount + discountAmount;
      const newGrandTotal = subtotal - newDiscountTotal;

      await models.Cart.update(
        {
          applied_coupon_code: coupon.code,
          discount_total: newDiscountTotal.toFixed(2),
          grand_total: Math.max(0, newGrandTotal).toFixed(2),
        },
        {
          where: { id: cart.id },
          transaction,
        },
      );

      await transaction.commit();

      return {
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount.toFixed(2),
        subtotal: subtotal.toFixed(2),
        discount_total: newDiscountTotal.toFixed(2),
        grand_total: Math.max(0, newGrandTotal).toFixed(2),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Check if coupon scope matches cart items
   */
  static isCouponApplicableToCart(coupon, cartItems) {
    const scopeId = parseInt(coupon.scope_id);

    for (const item of cartItems) {
      switch (coupon.scope_type) {
        case "variant":
          if (item.variant_id === scopeId) return true;
          break;
        case "model":
          if (item.variant?.product_model_id === scopeId) return true;
          break;
        case "product":
          if (item.product_id === scopeId) return true;
          break;
        case "category":
          if (item.product?.category_id === scopeId) return true;
          break;
      }
    }

    return false;
  }

  /**
   * Remove applied coupon from the cart
   */
  static async removeCoupon(userId, sessionId) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne({
        where: whereClause,
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError("Cart not found", HTTP_STATUS.BAD_REQUEST);
      }

      if (!cart.applied_coupon_code) {
        throw ErrorHandler.createError("No coupon is applied to this cart", HTTP_STATUS.BAD_REQUEST);
      }

      // Recalculate totals without coupon discount
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      // Clear the coupon code
      await models.Cart.update(
        { applied_coupon_code: null },
        {
          where: { id: cart.id },
          transaction,
        },
      );

      await transaction.commit();

      // Fetch updated cart
      const updatedCart = await models.Cart.findByPk(cart.id);

      return {
        subtotal: updatedCart.subtotal,
        discount_total: updatedCart.discount_total,
        grand_total: updatedCart.grand_total,
        applied_coupon_code: null,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAllAddressByUser(cartOwner) {
    const modelsMap = {
      user: {
        model: models.Address,
        field: "user_id",
        aliasName: "shipping_address",
      },
      guest: {
        model: models.CartAddress,
        field: "session_id",
        aliasName: "shipping_CartAddress",
      },
    };

    const { type, id: userId } = cartOwner;

    console.log(cartOwner);

    const config = modelsMap[type];

    const { model: Model, field, aliasName: alias } = config;

    const includeOptions = [
      {
        model: models.State,
        as: "state",
        attributes: ["id", "name", "slug"],
        include: [
          {
            model: models.Country,
            as: "country",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
      {
        model: Model,
        as: alias,
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["id", "name", "slug"],
            include: [
              {
                model: models.Country,
                as: "country",
                attributes: ["id", "name", "slug"],
              },
            ],
          },
        ],
      },
    ];

    const [billingAddresses, shippingAddresses] = await Promise.all([
      Model.findAll({
        where: { [field]: userId, address_type: "billing" },
        include: includeOptions,
      }),
      Model.findAll({
        where: { [field]: userId, address_type: "shipping" },
        include: includeOptions,
      }),
    ]);

    return {
      billing: billingAddresses?.map((item) => buildCheckoutFormPayload(item)) || [],
      shipping: shippingAddresses?.map((item) => buildCheckoutFormPayload(item)) || [],
    };
  }
}

module.exports = CheckOutService;
