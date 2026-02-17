const { models, sequelize } = require("../../../../database/models/index");
const { Op } = require("sequelize");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { generateProductBasedata, buildAttributesFromVariants } = require("./dataManipulations/product/product");

const productAttributes = [
  "id",
  "title",
  "title_ar",
  "slug",
  "description",
  "description_ar",
  "details",
  "details_ar",
  "details_points",
  "details_points_ar",
  "additional_details",
  "additional_details_ar",
  "media_path",
  "category_id",
  "sort_order",
  "status",
];

class ProductServiceHelpers {
  static async getProductBaseData(slug) {
    const cacheKey = cacheKeys?.productBaseDetail(slug);
    const baseDataFromCache = await getCache(cacheKey);
    // if (baseDataFromCache) {
    //   return {
    //     data: baseDataFromCache,
    //     fromCache: true,
    //   };
    // }

    const productBaseData = await models.ProductBase.findOne({
      where: { slug: slug, status: true },
      attributes: productAttributes,
      include: [
        { association: "sellingPoints", attributes: ["id", "name", "slug", "media_path"], through: { attributes: [] } },
        { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
        { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
        { association: "faqs", attributes: ["id", "question", "answer", "question_ar", "answer_ar"] },
      ],
    });

    const data = generateProductBasedata(productBaseData);
    await setCache(cacheKey, data);
    return {
      data,
      fromCache: false,
    };
  }

  static async getProductVariantRelatedModels(product_base_id) {
    const cacheKey = cacheKeys?.productVariantRelatedModels(product_base_id);
    const baseDataFromCache = await getCache(cacheKey);

    const productmodels = await models?.ProductModels?.findAll({
      where: { product_id: product_base_id, status: true },
      attributes: ["id", "code", "title", "title_ar", "slug", "media_path", "base_price"],
      include: [
        {
          association: "variants",
          attributes: ["id", "sku", "title", "title_ar", "price", "stock", "media_path"],
          required: false,
          include: [
            {
              association: "variant_images",
              attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"],
            },
            {
              association: "attribute_values",
              attributes: ["id"],
              through: { attributes: [] },
              include: [
                {
                  association: "attribute",
                  attributes: ["id", "name", "code", "slug"],
                },
              ],
            },
          ],
        },
      ],
    });

    const data =
      productmodels?.map((model) => ({
        id: model.id,
        code: model.code,
        title: model.title,
        title_ar: model.title_ar,
        slug: model.slug,
        base_price: model.base_price,
        media_path: generateImageUrl(model.media_path),
        variants:
          model.variants?.map((v) => ({
            id: v.id,
            sku: v.sku,
            title: v.title,
            title_ar: v.title_ar,
            price: v.price,
            stock: v.stock,
            media_path: generateImageUrl(v.media_path),
            hover_media_path: generateImageUrl(v.variant_images?.find((img) => !img.is_primary)?.media_path),
          })) || [],
        attributes: buildAttributesFromVariants(model.variants || []),
      })) || [];
    await setCache(cacheKey, data);
    return {
      data,
      fromCache: false,
    };
  }

  static async recalculateCartTotals(cartId, transaction = null) {
    const cartItems = await models.CartItems.findAll({
      where: { cart_id: cartId },
      transaction,
    });

    let subtotal = 0;
    let discountTotal = 0;

    for (const item of cartItems) {
      const itemTotal = parseFloat(item.final_price) * item.quantity;
      const itemDiscount = parseFloat(item.discount_amount);

      console.log("itemTotal", itemTotal);
      console.log("itemDiscount", itemDiscount);

      subtotal += itemTotal;
      discountTotal += itemDiscount;
    }

    console.log("subtotal", subtotal);
    console.log("discountTotal", discountTotal);

    const grandTotal = subtotal;

    await models.Cart.update(
      {
        subtotal: subtotal.toFixed(2),
        discount_total: discountTotal.toFixed(2),
        grand_total: grandTotal.toFixed(2),
      },
      {
        where: { id: cartId },
        returning: true,
        transaction,
      },
    );

    return { subtotal, discountTotal, grandTotal };
  }

  static async syncCartItemPrices(cart, transaction = null) {
    let priceChanged = false;

    for (const item of cart.items) {
      if (!item.variant) continue;

      const variantPrice = parseFloat(item.variant.price);
      const cartItemPrice = parseFloat(item.price);

      if (variantPrice !== cartItemPrice) {
        await item.update(
          {
            price: variantPrice,
            final_price: variantPrice,
          },
          { transaction },
        );
        priceChanged = true;
      }
    }

    if (priceChanged) {
      await this.recalculateCartTotals(cart.id, transaction);
    }

    return { priceChanged };
  }

  static async validateCoupon(cart, transaction = null) {
    const couponCode = cart.applied_coupon_code;
    if (!couponCode) return;

    const coupon = await models.Coupons.findOne({
      where: { code: couponCode },
      transaction,
    });



    if (!coupon) {
      await this.removeCouponFromCart(cart, transaction);
      return;
    }

    const now = new Date();
    const isExpired = coupon.end_at < now || coupon.start_at > now;
    const isInactive = !coupon.status;

    let isBelowMin = false;
    if (coupon.scope_type === "common") {
      // If there was a min_order_amount before, it seems to have been removed or should be handled here.
      // For now, if it's common and we don't have a min_order_amount field, we skip this check.
      if (coupon.min_order_amount && parseFloat(cart.subtotal) < parseFloat(coupon.min_order_amount)) {
        isBelowMin = true;
      }
    } else {
      // For scoped coupons, we check against min_product_amount
      const CheckOutService = require("../services/CheckOutService.js");
      const matchingItems = CheckOutService.getMatchingCartItems(coupon, cart.items || []);
      const eligibleSubtotal = matchingItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

      if (coupon.min_product_amount && eligibleSubtotal < parseFloat(coupon.min_product_amount)) {
        isBelowMin = true;
      }
    }

    console.log("IS EXPIRED", isExpired);
    console.log("IS INACTIVE", isInactive);
    console.log("IS BELOW MIN", isBelowMin);

    if (isExpired || isInactive || isBelowMin) {
      await this.removeCouponFromCart(cart, transaction);
      console.log("COUPON REMOVED");
      return;
    }

    return

  }

  static async removeCouponFromCart(cart, transaction = null) {
    // Reset item-level coupon fields
    await models.CartItems.update(
      {
        discount_amount: 0,
        final_price: sequelize.col("price"),
        coupon_id: null,
        applied_coupon_code: null,
        applied_coupon_scope: null,
      },
      {
        where: { cart_id: cart.id },
        transaction,
      },
    );

    // Clear cart-level coupon fields
    await cart.update(
      {
        applied_coupon_code: null,
        applied_coupon_scope: null,
        coupon_id: null,
        discount_total: 0,
        grand_total: cart.subtotal,
      },
      { transaction },
    );
  }


  static checkInvalidProducts(cartItems) {
    return cartItems.some((item) => {
      const variant = item.variant;

      if (!variant) return true;
      if (variant.stock <= 0) return true;
      if (variant.stock < item.quantity) return true;

      return false;
    });
  }
}

module.exports = ProductServiceHelpers;
