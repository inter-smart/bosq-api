const { Op } = require("sequelize");
const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const { buildCheckoutFormPayload } = require("../traits/dataManipulations/address.js");
const ProductServiceHelpers = require("../traits/products.js");
const { checkInvalidProducts } = require("../traits/dataManipulations/product/product.js");

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

  static async validateCheckout(user) {
    const { type, id: userId } = user;

    const whereClause = type == "user" ? { user_id: userId, status: "active" } : { session_id: userId, status: "active", user_id: null };

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
              attributes: ["id", "sku", "price", "media_path", "title", "stock"],
            },
          ],
        },
      ],
    });

    if (!cart || cart.items.length === 0) {
      throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_IS_EMPTY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST_ERROR);
    }

    if (checkInvalidProducts(cart.items)) {
      throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.ITEMS_OUT_OF_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST_ERROR);
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
          where: { is_buy_now: false },

          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title", "stock"],
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

    const appliedCouponScope = cart.applied_coupon_scope;

    appliedCouponScope !== "common" && (await ProductServiceHelpers.validateCoupon(cart));

    appliedCouponScope !== "common" &&
      (await cart.reload({
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
                attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar"],
              },
            ],
          },
        ],
      }));

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
      sub_total: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      applied_coupon_code: cart.applied_coupon_code,
      item_count: itemCount,
    };
  }

  /**
   * Get cart with  buy now items
   */
  static async getBuyNowCartData(userId, sessionId) {
    const whereClause = userId ? { user_id: userId } : { session_id: sessionId, user_id: null };

    console.log(`Fetching buy now cart data for ${userId ? "user" : "guest"} with ID ${userId || sessionId}`);

    const cart = await models.Cart.findOne({
      where: whereClause,
      include: [
        {
          model: models.CartItems,
          as: "items",
          where: { is_buy_now: true },
          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title", "stock"],
            },
          ],
        },
      ],
    });

    console.log("CART 1111", JSON.stringify(cart, null, 2));

    if (!cart) {
      return {
        cart: [],
      };
    }

    const appliedCouponScope = cart.applied_coupon_scope;

    appliedCouponScope !== "common" && (await ProductServiceHelpers.validateCoupon(cart));

    appliedCouponScope !== "common" &&
      (await cart.reload({
        include: [
          {
            model: models.CartItems,
            as: "items",
            where: { is_buy_now: true },
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "slug"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar"],
              },
            ],
          },
        ],
      }));

    console.log("CART 2222", JSON.stringify(cart, null, 2));

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
      sub_total: cart.subtotal,
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
                include: [
                  {
                    model: models.ProductModels,
                    as: "productModel",
                    attributes: ["id"],
                    include: [
                      {
                        model: models.ProductBase,
                        as: "product",
                        attributes: ["id", "category_id"],
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

      if (!cart || cart.items.length === 0) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_IS_EMPTY, HTTP_STATUS.BAD_REQUEST);
      }

      // 2. Check if a coupon is already applied
      if (cart.applied_coupon_code) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_ALREADY_APPLIED, HTTP_STATUS.BAD_REQUEST);
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
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_OR_EXPIRED_COUPON, HTTP_STATUS.BAD_REQUEST);
      }

      // 4. Check minimum order amount
      const subtotal = parseFloat(cart.subtotal);
      // 5. Check minimum order amount if it exists
      if (coupon.min_order_amount && subtotal < parseFloat(coupon.min_order_amount)) {
        const message = RESPONSE_MESSAGES.ERROR.MINIMUM_ORDER_AMOUNT_REQUIRED(coupon.min_order_amount);
        throw ErrorHandler.createError(message, HTTP_STATUS.BAD_REQUEST);
      }

      // 5. Check total usage limit
      const totalUsageCount = await models.CouponUsage.count({
        where: { coupon_id: coupon.id },
        transaction,
      });

      if (totalUsageCount >= coupon.usage_limit_total) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_USAGE_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST);
      }

      // 6. Check per-user usage limit (only for logged-in users)
      if (userId) {
        const userUsageCount = await models.CouponUsage.count({
          where: { coupon_id: coupon.id, user_id: userId },
          transaction,
        });

        if (userUsageCount >= coupon.usage_limit_per_user) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_USER_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 7. Validate scope - check if coupon applies to items in cart
      if (coupon.scope_type !== "common") {
        const isApplicable = this.isCouponApplicableToCart(coupon, cart.items);

        if (!isApplicable) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_NOT_APPLICABLE, HTTP_STATUS.BAD_REQUEST);
        }
      }

      // 8. Calculate discount amount

      await this.couponWiseUpdates(coupon, cart, transaction);

      await transaction.commit();

      const cartData = await this.getCartData(userId, null);

      return cartData;
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
          if (item.variant?.productModel?.product?.category_id == scopeId) return true;
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
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
      }

      if (!cart.applied_coupon_code) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.NO_COUPON_APPLIED, HTTP_STATUS.BAD_REQUEST);
      }

      const applliedCoupon = await models.Coupons.findOne({
        attributes: ["id", "scope_type", "scope_id"],
        where: {
          code: cart.applied_coupon_code,
        },
        transaction,
      });

      if (!applliedCoupon) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_OR_EXPIRED_COUPON, HTTP_STATUS.BAD_REQUEST);
      }

      await models.CartItems.update(
        {
          discount_amount: 0,
          final_price: sequelize.literal("ROUND(price * quantity, 2)"),
          coupon_id: null,
          applied_coupon_code: null,
          applied_coupon_scope: null,
        },
        {
          where: { cart_id: cart.id },
          transaction,
        },
      );

      // Recalculate totals without coupon discount
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      // Clear the coupon code from cart
      await models.Cart.update(
        {
          applied_coupon_code: null,
          coupon_id: null,
          applied_coupon_scope: null,
        },
        {
          where: { id: cart.id },
          transaction,
        },
      );

      await transaction.commit();

      // Fetch updated cart
      const updatedCart = await this.getCartData(userId, null);

      return updatedCart;
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

  static getMatchingCartItems(coupon, cartItems) {
    const scopeId = parseInt(coupon.scope_id);
    const minimumProductAmount = parseFloat(coupon.min_product_amount);
    return cartItems.filter((item) => {
      switch (coupon.scope_type) {
        case "variant":
          return item.variant_id === scopeId;
        case "model":
          return item.variant?.product_model_id === scopeId && item.final_price >= minimumProductAmount;
        case "product":
          return item.product_id === scopeId;
        case "category":
          return item.variant?.productModel?.product?.category_id === scopeId && item.final_price >= minimumProductAmount;
        default:
          return false;
      }
    });
  }

  static async couponWiseUpdates(coupon, cart, transaction) {
    const subtotal = parseFloat(cart.subtotal);

    if (coupon.scope_type === "common") {
      // Common scope: discount applies to entire cart subtotal
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount && discountAmount > parseFloat(coupon.max_discount_amount)) {
          discountAmount = parseFloat(coupon.max_discount_amount);
        }
      } else {
        discountAmount = parseFloat(coupon.discount_value);
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      console.log(discountAmount);

      const currentDiscount = parseFloat(cart.discount_total);
      const newDiscountTotal = currentDiscount + discountAmount;
      const newGrandTotal = subtotal - newDiscountTotal;

      await models.Cart.update(
        {
          applied_coupon_code: coupon.code,
          coupon_id: coupon.id,
          applied_coupon_scope: coupon.scope_type,
          discount_total: newDiscountTotal.toFixed(2),
          grand_total: Math.max(0, newGrandTotal).toFixed(2),
        },
        {
          where: { id: cart.id },
          transaction,
        },
      );

      return { discountAmount, newDiscountTotal, newGrandTotal };
    } else {
      // Scoped coupon: discount applies only to matching items
      const matchingItems = this.getMatchingCartItems(coupon, cart.items);

      if (matchingItems.length === 0) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_NOT_APPLICABLE, HTTP_STATUS.BAD_REQUEST);
      }

      // Calculate eligible subtotal from matching items only
      const eligibleSubtotal = matchingItems.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0);

      // Validate against min_product_amount
      if (coupon.min_product_amount && eligibleSubtotal < parseFloat(coupon.min_product_amount)) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.MINIMUM_ELIGIBLE_PRODUCTS_AMOUNT_REQUIRED(coupon.min_product_amount),
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

      let remainingMaxDiscount = round2(parseFloat(coupon.max_discount_amount || 0));
      let finalDiscountAmount = 0.0;

      const isPercentage = coupon.discount_type === "percentage";
      let discountAmount = round2(parseFloat(coupon.discount_value));

      // Cap fixed discount to eligible subtotal
      if (!isPercentage && discountAmount > eligibleSubtotal) {
        discountAmount = round2(eligibleSubtotal);
      }

      for (const item of matchingItems) {
        if (remainingMaxDiscount <= 0) break;

        const totalItems = item.quantity;
        const itemPrice = round2(parseFloat(item.price));
        const itemTotalPrice = round2(itemPrice * totalItems);

        let intendedDiscount = 0;

        if (isPercentage) {
          intendedDiscount = round2((itemTotalPrice * discountAmount) / 100);
        } else {
          intendedDiscount = round2(discountAmount);
        }

        // Apply only remaining max pool
        const itemDiscount = round2(Math.min(intendedDiscount, remainingMaxDiscount));

        const finalPrice = round2(itemTotalPrice - itemDiscount);

        await models.CartItems.update(
          {
            discount_amount: itemDiscount.toFixed(2),
            final_price: Math.max(0, finalPrice).toFixed(2),
            coupon_id: coupon.id,
            applied_coupon_code: coupon.code,
            applied_coupon_scope: coupon.scope_type,
          },
          {
            where: { id: item.id },
            transaction,
          },
        );

        remainingMaxDiscount = round2(remainingMaxDiscount - itemDiscount);
        finalDiscountAmount = round2(finalDiscountAmount + itemDiscount);
      }

      // Update cart totals
      const newDiscountTotal = round2(parseFloat(cart.discount_total) + finalDiscountAmount);

      const newGrandTotal = round2(subtotal - newDiscountTotal);

      await models.Cart.update(
        {
          applied_coupon_code: coupon.code,
          coupon_id: coupon.id,
          applied_coupon_scope: coupon.scope_type,
          discount_total: newDiscountTotal.toFixed(2),
          grand_total: Math.max(0, newGrandTotal).toFixed(2),
        },
        {
          where: { id: cart.id },
          transaction,
        },
      );

      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      return { discountAmount, newDiscountTotal, newGrandTotal };
    }
  }
}

module.exports = CheckOutService;
