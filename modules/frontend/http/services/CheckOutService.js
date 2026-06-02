const { Op } = require("sequelize");
const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const { buildCheckoutFormPayload } = require("../traits/dataManipulations/address.js");
const ProductServiceHelpers = require("../traits/products.js");
const MINIMUM_CART_SUBTOTAL = 500;

class CheckOutService {
  static async validateCheckout(user) {
    const { type, id: userId } = user;

    const whereClause =
      type == "user" ? { user_id: userId, status: "active", type: "cart" } : { session_id: userId, status: "active", user_id: null, type: "cart" };

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

    const invalidItems = cart.items
      .filter((item) => {
        if (!item.variant) return true;
        if (item.variant.stock != null && item.variant.stock <= 0) return true;
        if (item.variant.stock != null && item.variant.stock < item.quantity) return true;
        return false;
      })
      .map((item) => ({ id: item.id, variant_id: item.variant_id }));

    if (invalidItems.length > 0) {
      return { is_valid: false, invalid_items: invalidItems };
    }

    return { is_valid: true };
  }

  static async getCartDataWithDeliveryCharges(userId, sessionId, stateId) {
    const cart = await models.Cart.findOne({
      where: { user_id: "37", status: "active", type: "cart" },
      include: [
        {
          model: models.CartItems,
          as: "items",
          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id", "sku", "price", "media_path", "title", "stock"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id", "name", "parent_id"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return { items: [] };
    }

    let deliveryRules = [];
    if (stateId) {
      deliveryRules = await models.StateDeliveryRules.findAll({
        where: { state_id: stateId },
      });
    }

    const defaultRule = deliveryRules.find((r) => r.category_id === null);

    const items = cart.items.map((item) => {
      let deliveryCharge = 0;
      let ruleApplied = null;
      const categories = item.variant?.categories || [];
      // Extract unique parent categories for this variant
      const parentCategories = [];
      for (const cat of categories) {
        if (cat.parent_id && cat.parent) {
          if (!parentCategories.find((c) => c.id === cat.parent.id)) {
            parentCategories.push({ id: cat.parent.id, name: cat.parent.name });
          }
        } else {
          if (!parentCategories.find((c) => c.id === cat.id)) {
            parentCategories.push({ id: cat.id, name: cat.name });
          }
        }
      }

      if (stateId && deliveryRules.length > 0) {
        // Find if any parent category of this variant has a specific rule
        for (const parentCat of parentCategories) {
          const rule = deliveryRules.find((r) => r.category_id === parentCat.id);
          if (rule) {
            ruleApplied = rule;
            break;
          }
        }

        // If no specific category matched, fallback to default rule
        if (!ruleApplied && defaultRule) {
          ruleApplied = defaultRule;
        }

        if (ruleApplied && !ruleApplied.is_free) {
          deliveryCharge = parseFloat(ruleApplied.charge);
        }
      }

      let calculatedTotalDeliveryCharge = 0;
      let redirectToSales = false;

      if (item.quantity === 1) {
        calculatedTotalDeliveryCharge = deliveryCharge;
      } else if (item.quantity >= 2 && item.quantity <= 10) {
        calculatedTotalDeliveryCharge = deliveryCharge * 2;
      } else if (item.quantity > 10) {
        calculatedTotalDeliveryCharge = 0; // Delivery is handled by sales team
        redirectToSales = true;
      }

      return {
        id: item.id,
        variant_id: item.variant_id,
        title: item.variant?.title || "",
        slug: item.variant?.sku || "",
        price: item.price,
        media_path: generateImageUrl(item?.variant?.media_path),
        quantity: item.quantity,
        categories: parentCategories,
        delivery_charge_per_unit: deliveryCharge,
        total_delivery_charge: calculatedTotalDeliveryCharge.toFixed(2),
        redirect_to_sales: redirectToSales,
        discount_amount: item.discount_amount,
        line_total: (parseFloat(item.price) * item.quantity + calculatedTotalDeliveryCharge - item.discount_amount).toFixed(2),
        is_sold_out: item.variant ? item.variant.stock < item.quantity : false,
      };
    });

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const overallDeliveryCharge = items.reduce((sum, item) => sum + parseFloat(item.total_delivery_charge), 0);
    const requiresSalesContact = items.some((item) => item.redirect_to_sales);

    return {
      id: cart.id,
      items,
      sub_total: cart.subtotal,
      tax_total: cart.tax_total,
      overall_delivery_charge: overallDeliveryCharge.toFixed(2),
      requires_sales_contact: requiresSalesContact,
      grand_total: cart.grand_total,
      item_count: itemCount,
    };
  }

  /**
   * Calculate shipping charge for a given stateId (called from the new API endpoint).
   * Reuses the same flat-rate threshold + calculateCartShippingCharge logic as getCartData.
   */
  static async getShippingChargeForState(userId, sessionId, stateId) {
    const whereClause = userId
      ? { user_id: userId, status: "active", type: "cart" }
      : { session_id: sessionId, status: "active", user_id: null, type: "cart" };

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
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id", "name", "parent_id"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return { overall_delivery_charge: "0.00" };
    }

    const cartSubTotal = parseFloat(cart?.subtotal || 0);
    const isChargeCalculationNeeded = cartSubTotal > MINIMUM_CART_SUBTOTAL;

    let overallDeliveryCharge = isChargeCalculationNeeded ? 0 : 100;

    if (isChargeCalculationNeeded && stateId) {
      const shippingChargeData = await this.calculateCartShippingCharge(cart, stateId);
      overallDeliveryCharge = shippingChargeData.overallDeliveryCharge;
    }

    return { overall_delivery_charge: overallDeliveryCharge.toFixed(2) };
  }

  static async calculateCartShippingCharge(cart, stateId) {
    if (!stateId || !cart || !cart.items || cart.items.length === 0) {
      return { overallDeliveryCharge: 0, requiresSalesContact: false, itemsCharges: [] };
    }

    const deliveryRules = await models.StateDeliveryRules.findAll({
      where: { state_id: stateId },
    });

    const defaultRule = deliveryRules.find((r) => r.category_id === null);

    const itemsCharges = cart.items.map((item) => {
      let deliveryCharge = 0;
      let ruleApplied = null;
      const categories = item.variant?.categories || [];
      const parentCategories = [];

      for (const cat of categories) {
        if (cat.parent_id && cat.parent) {
          if (!parentCategories.find((c) => c.id === cat.parent.id)) {
            parentCategories.push({ id: cat.parent.id, name: cat.parent.name });
          }
        } else {
          if (!parentCategories.find((c) => c.id === cat.id)) {
            parentCategories.push({ id: cat.id, name: cat.name });
          }
        }
      }

      if (deliveryRules.length > 0) {
        for (const parentCat of parentCategories) {
          const rule = deliveryRules.find((r) => r.category_id === parentCat.id);
          if (rule) {
            ruleApplied = rule;
            break;
          }
        }

        if (!ruleApplied && defaultRule) {
          ruleApplied = defaultRule;
        }

        if (ruleApplied && !ruleApplied.is_free) {
          deliveryCharge = parseFloat(ruleApplied.charge);
        }
      }

      let calculatedTotalDeliveryCharge = 0;
      let redirectToSales = false;

      if (item.quantity === 1) {
        calculatedTotalDeliveryCharge = deliveryCharge;
      } else if (item.quantity >= 2 && item.quantity <= 10) {
        calculatedTotalDeliveryCharge = deliveryCharge * 2;
      } else if (item.quantity > 10) {
        calculatedTotalDeliveryCharge = 0;
        redirectToSales = true;
      }

      return {
        itemId: item.id,
        totalDeliveryCharge: calculatedTotalDeliveryCharge,
        redirectToSales,
      };
    });

    const overallDeliveryCharge = itemsCharges.reduce((sum, item) => sum + item.totalDeliveryCharge, 0);
    const requiresSalesContact = itemsCharges.some((item) => item.redirectToSales);

    console.log("calculatedTotalDeliveryCharge ===>", overallDeliveryCharge);

    return {
      overallDeliveryCharge,
      requiresSalesContact,
      itemsCharges,
    };
  }

  static async getCartData(userId, sessionId) {
    const whereClause = userId
      ? { user_id: userId, status: "active", type: "cart" }
      : { session_id: sessionId, status: "active", user_id: null, type: "cart" };

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
              attributes: ["id", "sku", "price", "media_path", "title", "stock"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id", "name", "parent_id"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
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

    const cartOwner = userId ? { type: "user", id: userId } : { type: "guest", id: sessionId };

    const cartSubTotal = parseFloat(cart?.subtotal || 0);
    const isChargeCalculationNeeded = cartSubTotal > MINIMUM_CART_SUBTOTAL;

    let stateId = null;

    if (cartOwner.id && isChargeCalculationNeeded) {
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

      const config = modelsMap[cartOwner.type];
      if (config) {
        const { model: Model, field } = config;

        const addresses = await Model.findAll({
          where: { [field]: cartOwner.id },
        });

        let candidateAddresses = [];
        const shippingAddresses = addresses.filter((a) => a.address_type === "shipping");
        const billingAddresses = addresses.filter((a) => a.address_type === "billing");

        if (shippingAddresses.length > 0) {
          candidateAddresses = shippingAddresses;
        } else if (billingAddresses.length > 0) {
          candidateAddresses = billingAddresses;
        }

        let selectedAddress = null;
        if (candidateAddresses.length > 0) {
          selectedAddress = candidateAddresses.find((a) => a.is_default) || candidateAddresses[0];
        }

        if (selectedAddress) {
          stateId = selectedAddress.state_id;
        }
      }
    }

    let overallDeliveryCharge = isChargeCalculationNeeded ? 0 : 100;
    let requiresSalesContact = false;
    let itemsCharges = [];

    if (isChargeCalculationNeeded) {
      const shippingChargeData = await this.calculateCartShippingCharge(cart, stateId);
      overallDeliveryCharge = shippingChargeData.overallDeliveryCharge;
      requiresSalesContact = shippingChargeData.requiresSalesContact;
      itemsCharges = shippingChargeData.itemsCharges;
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items: cart.items.map((item) => {
        const itemCharge = itemsCharges.find((i) => i.itemId === item.id);

        return {
          id: item.id,
          variant_id: item.variant_id,
          title: item.variant?.title || "",
          slug: item.variant?.sku || "",
          price: item.price,
          media_path: generateImageUrl(item?.variant?.media_path),
          quantity: item.quantity,
          discount_amount: item.discount_amount,
          line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
          is_sold_out: item.variant ? item.variant.stock < item.quantity : false,
        };
      }),
      sub_total: cart.subtotal,
      tax_total: cart.tax_total,
      overall_delivery_charge: overallDeliveryCharge.toFixed(2),
      requires_sales_contact: requiresSalesContact,
      grand_total: cart.grand_total,
      item_count: itemCount,
    };
  }

  /**
   * Get cart with  buy now items
   */
  static async getBuyNowCartData(userId, sessionId) {
    const whereClause = userId
      ? { user_id: userId, status: "active", type: "buynow" }
      : { session_id: sessionId, status: "active", user_id: null, type: "buynow" };

    console.log(`Fetching buy now cart data for ${userId ? "user" : "guest"} with ID ${userId || sessionId}`);

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
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id", "name", "parent_id"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
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

    await ProductServiceHelpers.syncCartItemPrices(cart);

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
              attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id", "name", "parent_id"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const cartOwner = userId ? { type: "user", id: userId } : { type: "guest", id: sessionId };

    const cartSubTotal = parseFloat(cart?.subtotal || 0);
    const isChargeCalculationNeeded = cartSubTotal > MINIMUM_CART_SUBTOTAL;

    let stateId = null;

    if (cartOwner.id && isChargeCalculationNeeded) {
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

      const config = modelsMap[cartOwner.type];
      if (config) {
        const { model: Model, field } = config;

        const addresses = await Model.findAll({
          where: { [field]: cartOwner.id },
        });

        let candidateAddresses = [];
        const shippingAddresses = addresses.filter((a) => a.address_type === "shipping");
        const billingAddresses = addresses.filter((a) => a.address_type === "billing");

        if (shippingAddresses.length > 0) {
          candidateAddresses = shippingAddresses;
        } else if (billingAddresses.length > 0) {
          candidateAddresses = billingAddresses;
        }

        let selectedAddress = null;
        if (candidateAddresses.length > 0) {
          selectedAddress = candidateAddresses.find((a) => a.is_default) || candidateAddresses[0];
        }

        if (selectedAddress) {
          stateId = selectedAddress.state_id;
        }
      }
    }

    let overallDeliveryCharge = isChargeCalculationNeeded ? 0 : 100;
    let requiresSalesContact = false;
    let itemsCharges = [];

    if (isChargeCalculationNeeded) {
      const shippingChargeData = await this.calculateCartShippingCharge(cart, stateId);
      overallDeliveryCharge = shippingChargeData.overallDeliveryCharge;
      requiresSalesContact = shippingChargeData.requiresSalesContact;
      itemsCharges = shippingChargeData.itemsCharges;
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items: cart.items.map((item) => {
        return {
          id: item.id,
          variant_id: item.variant_id,
          title: item.variant?.title || "",
          slug: item.variant?.sku || "",
          price: item.price,
          media_path: generateImageUrl(item?.variant?.media_path),
          quantity: item.quantity,
          discount_amount: item.discount_amount,
          line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
          is_sold_out: item.variant ? item.variant.stock < item.quantity : false,
        };
      }),
      overall_delivery_charge: overallDeliveryCharge.toFixed(2),
      requires_sales_contact: requiresSalesContact,
      sub_total: cart.subtotal,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      item_count: itemCount,
    };
  }

  /**
   * Apply a coupon code to the cart
   */
  static async applyCoupon(userId, couponCode, cartType = "cart") {
    const transaction = await sequelize.transaction();

    try {
      // 1. Find the active cart
      const whereClause = { user_id: userId, status: "active", type: cartType };

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
                    // Needed for category-scoped coupons (category is now M2M on variants)
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

      if (coupon.scope_type !== "common") {
        const isApplicable = this.isCouponApplicableToCart(coupon, cart.items);

        if (!isApplicable) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_NOT_APPLICABLE, HTTP_STATUS.BAD_REQUEST);
        }
      }

      const totalUsageCount = await models.CouponUsage.count({
        where: { coupon_id: coupon.id },
        transaction,
      });

      if (totalUsageCount >= coupon.usage_limit_total) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_USAGE_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST);
      }

      if (userId) {
        const userUsageCount = await models.CouponUsage.count({
          where: { coupon_id: coupon.id, user_id: userId },
          transaction,
        });

        if (userUsageCount >= coupon.usage_limit_per_user) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.COUPON_USER_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST);
        }
      }

      const subtotal = parseFloat(cart.subtotal);

      if (coupon.min_order_amount && subtotal < parseFloat(coupon.min_order_amount)) {
        const message = RESPONSE_MESSAGES.ERROR.MINIMUM_ORDER_AMOUNT_REQUIRED(coupon.min_order_amount);
        throw ErrorHandler.createError(message, HTTP_STATUS.BAD_REQUEST);
      }

      // 8. Calculate discount amount

      const { discountAmount, newDiscountTotal, newGrandTotal, itemDiscounts } = await this.couponWiseUpdates(coupon, cart, transaction);

      await transaction.commit();

      const cartData = {
        coupon_discount_value: discountAmount,
        grand_total: newGrandTotal,
        discount_total: newDiscountTotal,
        applied_coupon_code: coupon.code,
        coupon_scope_type: coupon.scope_type,
        item_discounts: itemDiscounts
          ? Array.from(itemDiscounts.entries()).map(([id, amount]) => ({
            id,
            amount: parseFloat(amount.toFixed(2)),
          }))
          : null,
      };

      return cartData;
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
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
          if (item.variant?.productModel?.product?.id === scopeId) return true;
          break;
        case "category":
          // Category is now M2M on variants — check the variant's categories array
          if (item.variant?.categories?.some((cat) => cat.id === scopeId)) return true;
          break;
      }
    }

    return false;
  }

  /**
   * Remove applied coupon from the cart
   */
  static async removeCoupon(userId, sessionId, cartType = "cart") {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId
        ? { user_id: userId, status: "active", type: cartType }
        : { session_id: sessionId, status: "active", user_id: null, type: cartType };

      const cart = await models.Cart.findOne({
        where: whereClause,
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
      }

      // if (!cart.applied_coupon_code) {
      //   throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.NO_COUPON_APPLIED, HTTP_STATUS.BAD_REQUEST);
      // }

      // const applliedCoupon = await models.Coupons.findOne({
      //   attributes: ["id", "scope_type", "scope_id"],
      //   where: {
      //     code: cart.applied_coupon_code,
      //   },
      //   transaction,
      // });

      // if (!applliedCoupon) {
      //   throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_OR_EXPIRED_COUPON, HTTP_STATUS.BAD_REQUEST);
      // }

      // await models.CartItems.update(
      //   {
      //     discount_amount: 0,
      //     final_price: sequelize.literal("ROUND(price * quantity, 2)"),
      //     coupon_id: null,
      //     applied_coupon_code: null,
      //     applied_coupon_scope: null,
      //   },
      //   {
      //     where: { cart_id: cart.id },
      //     transaction,
      //   },
      // );

      // Recalculate totals without coupon discount
      // await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      // Clear the coupon code from cart
      // await models.Cart.update(
      //   {
      //     applied_coupon_code: null,
      //     coupon_id: null,
      //     applied_coupon_scope: null,
      //   },
      //   {
      //     where: { id: cart.id },
      //     transaction,
      //   },
      // );

      await transaction.commit();

      // Fetch updated cart
      const updatedCart = cartType === "buynow" ? await this.getBuyNowCartData(userId, null) : await this.getCartData(userId, null);

      return updatedCart;
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
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
          return item.variant?.productModel?.product?.id === scopeId;
        case "category":
          // Category is now M2M on variants — check the variant's categories array
          return (item.variant?.categories?.some((cat) => cat.id === scopeId) ?? false) && item.final_price >= minimumProductAmount;
        default:
          return false;
      }
    });
  }

  static async couponWiseUpdates(coupon, cart, transaction, persist = false) {
    const subtotal = parseFloat(cart.subtotal);

    if (coupon.scope_type === "common") {
      // Common scope: discount applies to entire cart subtotal
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
        if (parseFloat(coupon.max_discount_amount) !== 0.0 && discountAmount > parseFloat(coupon.max_discount_amount)) {
          discountAmount = parseFloat(coupon.max_discount_amount);
        }
      } else {
        discountAmount = parseFloat(coupon.discount_value);
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      const currentDiscount = parseFloat(cart.discount_total);
      const newDiscountTotal = currentDiscount + discountAmount;
      const newGrandTotal = subtotal - newDiscountTotal;

      if (persist) {
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
      }

      return { discountAmount, newDiscountTotal, newGrandTotal, itemDiscounts: null };
    } else {
      // Scoped coupon: discount applies only to matching items

      const matchingItems = this.getMatchingCartItems(coupon, cart.items).sort((a, b) => b.quantity * b.price - a.quantity * a.price);

      console.log("Matching items for coupon:", JSON.stringify(matchingItems, null, 2));

      if (matchingItems.length === 0) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.MINIMUM_ELIGIBLE_PRODUCTS_AMOUNT_REQUIRED(coupon.min_product_amount),
          HTTP_STATUS.BAD_REQUEST,
        );
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

      const maxDiscountCap =
        coupon.max_discount_amount && parseFloat(coupon.max_discount_amount) > 0 ? round2(parseFloat(coupon.max_discount_amount)) : Infinity;
      let remainingMaxDiscount = maxDiscountCap;
      let finalDiscountAmount = 0.0;

      const isPercentage = coupon.discount_type === "percentage";
      let discountAmount = round2(parseFloat(coupon.discount_value));

      // Cap fixed discount to eligible subtotal
      if (!isPercentage && discountAmount > eligibleSubtotal) {
        discountAmount = round2(eligibleSubtotal);
      }

      const itemDiscounts = new Map();

      for (const item of matchingItems) {
        console.log("Remaining max discount", remainingMaxDiscount);
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

        console.log(itemDiscount);
        console.log(finalPrice);

        itemDiscounts.set(item.id, itemDiscount);

        if (persist) {
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
        }

        remainingMaxDiscount = round2(remainingMaxDiscount - itemDiscount);
        finalDiscountAmount = round2(finalDiscountAmount + itemDiscount);
      }

      // Update cart totals
      const newDiscountTotal = round2(parseFloat(cart.discount_total) + finalDiscountAmount);

      const newGrandTotal = round2(subtotal - newDiscountTotal);

      if (persist) {
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
      }

      console.log(discountAmount, newDiscountTotal, newGrandTotal);

      return { discountAmount: newDiscountTotal, newDiscountTotal, newGrandTotal, itemDiscounts };
    }
  }
}

module.exports = CheckOutService;
