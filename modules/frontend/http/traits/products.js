const { models, sequelize } = require("../../../../database/models/index");
const { Op, where } = require("sequelize");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const {
  generateProductBasedata,
  buildAttributesFromVariants,
  generateQueryParams,
  isItemWishListed,
} = require("./dataManipulations/product/product");

const productAttributes = ["id", "title", "title_ar", "slug", "media_path", "sort_order", "status"];

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
        {
          association: "sellingPoints",
          attributes: ["id", "name", "name_ar", "slug", "media_path", "status"],
          where: { status: true },
          required: false,
          through: { attributes: [] },
        },
      ],
      order: [[{ model: models.ProductSellingPoints, as: "sellingPoints" }, "sort_order", "ASC"]],
    });

    const data = generateProductBasedata(productBaseData);
    await setCache(cacheKey, data);
    return {
      data,
      fromCache: false,
    };
  }

  static async getSimiliarProducts(modelId, variantId, userId = null, isLoggedInUser = false) {
    const variants = await models.ProductVariants.findAll({
      where: {
        product_model_id: modelId,
        id: { [Op.ne]: variantId },
        status: true,
      },
      limit: 6,
      include: [
        {
          model: models.ProductCategory,
          as: "categories",
          attributes: ["id", "name", "name_ar", "slug"],
          through: { attributes: [] },
          required: false,
        },
        {
          model: models.ProductModels,
          as: "productModel",
          attributes: ["id", "slug", "title"],
          include: [
            {
              model: models.ProductBase,
              as: "product",
              attributes: ["id", "slug"],
            },
          ],
        },
        {
          model: models.ProductVariantAttributes,
          as: "variant_attributes",
          attributes: ["id", "attribute_id", "attribute_value_id"],
          include: [
            {
              model: models.ProductAttribute,
              as: "ProductAttribute",
              attributes: ["id", "name", "name_ar", "code", "slug"],
            },
            {
              model: models.AttributeValues,
              as: "AttributeValue",
              attributes: ["id", "value", "value_ar", "slug"],
            },
          ],
        },
      ],
    });

    const modelVariantCount = await models.ProductVariants.count({
      where: { product_model_id: modelId, status: true },
    });

    let wishlistedItems = [];

    if (isLoggedInUser && userId) {
      wishlistedItems = await models.Wishlist.findAll({
        where: { user_id: userId },
        attributes: ["product_variant_id"],
        raw: true,
      });
    }

    const isVariantWishListed = wishlistedItems.some((item) => item.product_variant_id == variantId);

    const similarProducts = variants.map((item) => {
      const json = item.toJSON();

      const formattedAttributes = (json?.variant_attributes || []).map((va) => ({
        code: va?.ProductAttribute?.code,
        slug: va?.ProductAttribute?.slug,
        values: [
          {
            slug: va?.AttributeValue?.slug,
            value: va?.AttributeValue?.value,
          },
        ],
      }));

      const baseSlug = json?.productModel?.product?.slug;
      const modelSlug = json?.productModel?.slug;
      const variantSku = json?.sku;

      return {
        id: json?.id,
        title: json?.title,
        title_ar: json?.title_ar,
        media_path: generateImageUrl(json?.media_path),
        slug: json?.sku,
        base_slug: baseSlug,
        model_slug: modelSlug,
        product_code: json?.product_code,
        isWishlisted: isItemWishListed(json?.id, wishlistedItems),
        variants_available: json?.has_more_items,
        hasMoreVariants: modelVariantCount > 1,
        price: json?.price,
        stock: json?.stock,
        categories: (json?.categories || []).map((c) => ({ id: c.id, name: c.name, name_ar: c.name_ar, slug: c.slug })),
        variant_attributes: json?.variant_attributes,
        query_params: generateQueryParams(variantSku, formattedAttributes),
      };
    });

    return {
      similarProducts,
      isVariantWishListed,
    };
  }

  static async getBoughtTogetherProducts(variantId, currentItem) {
    if (!variantId || !currentItem) return null;

    const variant = await models.ProductVariants.findByPk(variantId, {
      attributes: ["id"],
      include: [
        {
          association: "boughtTogetherVariants",
          attributes: ["id", "sku", "title", "title_ar", "media_path", "price", "stock", "product_code", "product_model_id", "hover_media_path"],
          through: { attributes: [] },
          where: { status: true },
          required: false,
          include: [
            {
              model: models.ProductCategory,
              as: "categories",
              attributes: ["id", "name", "name_ar", "slug"],
              through: { attributes: [] },
              required: false,
            },
            {
              model: models.ProductModels,
              as: "productModel",
              attributes: ["id", "slug", "title"],
              include: [
                {
                  model: models.ProductBase,
                  as: "product",
                  attributes: ["id", "slug"],
                },
              ],
            },
            {
              model: models.ProductVariantAttributes,
              as: "variant_attributes",
              attributes: ["id", "attribute_id", "attribute_value_id"],
              include: [
                {
                  model: models.ProductAttribute,
                  as: "ProductAttribute",
                  attributes: ["id", "name", "name_ar", "code", "slug"],
                },
                {
                  model: models.AttributeValues,
                  as: "AttributeValue",
                  attributes: ["id", "value", "value_ar", "slug"],
                },
              ],
            },
          ],
        },
      ],
    });

    const rawItems = variant?.boughtTogetherVariants ?? [];

    if (rawItems.length == 0) return null;

    const products = rawItems.map((item) => {
      const json = item.toJSON();

      const formattedAttributes = (json?.variant_attributes || []).map((va) => ({
        code: va?.ProductAttribute?.code,
        slug: va?.ProductAttribute?.slug,
        values: [
          {
            slug: va?.AttributeValue?.slug,
            value: va?.AttributeValue?.value,
          },
        ],
      }));

      const baseSlug = json?.productModel?.product?.slug;
      const modelSlug = json?.productModel?.slug;

      return {
        id: json?.id,
        title: json?.title,
        title_ar: json?.title_ar,
        variant_image: generateImageUrl(json?.media_path),
        hover_image: generateImageUrl(json?.hover_media_path),
        slug: json?.sku,
        base_slug: baseSlug,
        model_slug: modelSlug,
        product_code: json?.product_code,
        price: json?.price,
        stock: json?.stock,
        categories: (json?.categories || []).map((c) => ({ id: c.id, name: c.name, name_ar: c.name_ar, slug: c.slug })),
        query_params: generateQueryParams(json?.sku, formattedAttributes),
      };
    });

    const finalisedProducts = [currentItem, ...products].filter((p) => p.stock > 0);

    const totalItems = finalisedProducts.length;
    const totalPrice = finalisedProducts.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    return { products: finalisedProducts, totalItems, totalPrice };
  }

  static async recalculateCartTotals(cartId, type = "cart", transaction = null) {
    const [cart, cartItems] = await Promise.all([
      models.Cart.findOne({
        where: { id: cartId },
        attributes: ["id", "applied_coupon_scope", "discount_total", "applied_coupon_code"],
        transaction,
      }),
      models.CartItems.findAll({
        where: { cart_id: cartId, is_buy_now: type === "buynow" },
        transaction,
      }),
    ]);

    let subtotal = 0;
    let discountTotal = 0;

    for (const item of cartItems) {
      // Always sum the pre-discount line price so subtotal reflects original prices
      subtotal += parseFloat(item.price) * item.quantity;
      discountTotal += parseFloat(item.discount_amount || 0);
    }

    // Common scope coupons store the discount at cart level only — CartItems have no
    // discount_amount — so we must derive the correct discount from the coupon itself.
    if (cart?.applied_coupon_scope === "common" && cart?.applied_coupon_code) {
      const coupon = await models.Coupons.findOne({
        where: { code: cart.applied_coupon_code },
        attributes: ["discount_type", "discount_value", "max_discount_amount"],
        transaction,
      });

      if (coupon) {
        if (coupon.discount_type === "percentage") {
          // Percentage discount must be recalculated against the NEW subtotal
          let pctDiscount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount_amount && pctDiscount > parseFloat(coupon.max_discount_amount)) {
            pctDiscount = parseFloat(coupon.max_discount_amount);
          }

          discountTotal = pctDiscount;
          // Keep cart.discount_total in sync
          await models.Cart.update({ discount_total: pctDiscount.toFixed(2) }, { where: { id: cartId }, transaction });
        } else {
          // Fixed discount: the amount doesn't change with subtotal
          discountTotal = Math.min(parseFloat(cart.discount_total || 0), subtotal);
        }
      }
    }

    const grandTotal = Math.max(0, subtotal - discountTotal);

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
      const cartQuantity = item.quantity;

      if (variantPrice !== cartItemPrice) {
        // Preserve any existing coupon discount when the price changes
        const existingDiscount = parseFloat(item.discount_amount || 0);
        const newFinalPrice = Math.max(0, variantPrice * cartQuantity - existingDiscount);
        await item.update(
          {
            price: variantPrice,
            final_price: newFinalPrice.toFixed(2),
          },
          { transaction },
        );
        priceChanged = true;
      }
    }

    await this.recalculateCartTotals(cart.id, transaction);

    return { priceChanged };
  }

  static async validateCoupon(cart, transaction = null) {
    const couponCode = cart.applied_coupon_code;

    const coupon = await models.Coupons.findOne({
      where: { code: couponCode },
      transaction,
    });

    if (!coupon) {
      const priceChanged = await this.syncCartItemPrices(cart, transaction);
      return { priceChanged };
    }

    const now = new Date();
    const isExpired = coupon.end_at < now || coupon.start_at > now;
    const isInactive = !coupon.status;
    const isBelowMin = coupon.min_order_amount && parseFloat(cart.subtotal) < parseFloat(coupon.min_order_amount);

    if (isExpired || isInactive || isBelowMin) {
      await this.removeCouponFromCart(cart, transaction);
    }

    const priceChanged = await this.syncCartItemPrices(cart, transaction);

    return { priceChanged };
  }

  static async removeCouponFromCart(cart, transaction = null) {
    // Reset item-level coupon fields
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

    // Clear cart-level coupon fields
    await cart.update(
      {
        applied_coupon_code: null,
        coupon_id: null,
        applied_coupon_scope: null,
      },
      { transaction },
    );
  }
}

module.exports = ProductServiceHelpers;
