const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const ProductServiceHelpers = require("../traits/products.js");
const { isItemWishListed, generateQueryParams } = require("../traits/dataManipulations/product/product.js");
const { Op } = require("sequelize");

class CartService {
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

  /**
   * Set all other buy now to false to set the new item for buy now, ensuring only one buy now item at a time
   */
  static async revertBuyNowItems(cartId, transaction = null) {
    const cartItems = await models.CartItems.findAll({
      where: {
        cart_id: cartId,
      },
      transaction,
    });

    if (!cartItems || cartItems.length === 0) {
      return;
    }
    await models.CartItems.destroy({
      where: {
        cart_id: cartId,
        is_buy_now: true,
      },
      transaction,
    });
  }

  /**
   * Get cart with items
   */
  static async getCart(userId, sessionId) {
    const transaction = await sequelize.transaction();
    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne(
        {
          where: whereClause,
          include: [
            {
              model: models.CartItems,
              as: "items",
              where: { is_buy_now: false },
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
        },
        { transaction },
      );

      if (!cart) {
        await transaction.commit();
        return {
          items: [],
          subtotal: "0.00",
          discount_total: "0.00",
          tax_total: "0.00",
          grand_total: "0.00",
          item_count: 0,
        };
      }

      await ProductServiceHelpers.validateCoupon(cart);

      // Reload cart with fresh data after price sync
      await cart.reload({
        include: [
          {
            model: models.CartItems,
            as: "items",
            where: { is_buy_now: false },
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
        transaction,
      });

      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      await transaction.commit();

      return {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          product_id: item?.product_id,
          variant_id: item?.variant_id,
          title: item?.variant?.title,
          media_path: generateImageUrl(item?.variant?.media_path),
          quantity: item?.quantity,
          price: item?.price,
          discount_amount: item?.discount_amount,
          line_total: (parseFloat(item?.price || 0) * item?.quantity || 0).toFixed(2),
          is_sold_out: item?.variant ? item?.variant.stock < item?.quantity : false,
          product: item?.product,
          variant: item?.variant,
        })),
        subtotal: cart?.subtotal,
        discount_total: cart?.discount_total,
        tax_total: cart?.tax_total,
        grand_total: cart?.grand_total,
        applied_coupon_code: cart?.applied_coupon_code,
        item_count: itemCount,
      };
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addItem(userId, sessionId, variantId, quantity = 1) {
    const transaction = await sequelize.transaction();

    try {
      const variant = await models.ProductVariants.findOne({
        attributes: ["id", "price", "status", "stock"],
        where: { id: variantId, status: true },
        transaction,
      });

      if (!variant) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PRODUCT_VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (variant.stock < quantity) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      let price = variant.price;

      const cart = await this.getOrCreateCart(userId, sessionId, transaction);

      const existingItem = await models.CartItems.findOne({
        where: {
          cart_id: cart.id,
          variant_id: variantId || null,
        },
        transaction,
      });

      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

      if (currentQuantityInCart + quantity > variant.stock) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (existingItem) {
        await existingItem.update(
          {
            quantity: existingItem.quantity + quantity,
            final_price: (existingItem.quantity + quantity) * price,
          },
          { transaction },
        );
      } else {
        await models.CartItems.create(
          {
            cart_id: cart.id,
            variant_id: variantId || null,
            quantity,
            price,
            final_price: quantity * price,
            discount_amount: 0,
          },
          { transaction },
        );
      }

      // Recalculate totals
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      return;

      // Return updated cart
      // return await this.getCart(userId, sessionId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Add multiple items to cart (qty 1 each) — used for "Frequently Bought Together"
   */
  static async addMultipleItems(userId, sessionId, variantIds = []) {
    const transaction = await sequelize.transaction();

    try {
      const cart = await this.getOrCreateCart(userId, sessionId, transaction);

      for (const variantId of variantIds) {
        const variant = await models.ProductVariants.findOne({
          attributes: ["id", "price", "status", "stock"],
          where: { id: variantId, status: true },
          transaction,
        });

        if (!variant) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PRODUCT_VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
        }

        if (variant.stock < 1) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
        }

        const existingItem = await models.CartItems.findOne({
          where: { cart_id: cart.id, variant_id: variantId },
          transaction,
        });

        const currentQty = existingItem ? existingItem.quantity : 0;

        if (currentQty + 1 > variant.stock) {
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
        }

        if (existingItem) {
          await existingItem.update(
            {
              quantity: existingItem.quantity + 1,
              final_price: (existingItem.quantity + 1) * variant.price,
            },
            { transaction },
          );
        } else {
          await models.CartItems.create(
            {
              cart_id: cart.id,
              variant_id: variantId,
              quantity: 1,
              price: variant.price,
              final_price: variant.price,
              discount_amount: 0,
            },
            { transaction },
          );
        }
      }

      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      return;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Buy now - add item to cart with is_buy_now flag
   */
  static async buyNowItem(userId, sessionId, variantId, quantity = 1) {
    const transaction = await sequelize.transaction();

    try {
      const variant = await models.ProductVariants.findOne({
        attributes: ["id", "price", "status", "stock"],
        where: { id: variantId, status: true },
        transaction,
      });

      if (!variant) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PRODUCT_VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (variant.stock < quantity) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      let price = variant.price;

      const cart = await this.getOrCreateCart(userId, sessionId, transaction);

      const existingItem = await models.CartItems.findOne({
        where: {
          cart_id: cart.id,
          variant_id: variantId || null,
          is_buy_now: true,
        },
        transaction,
      });

      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

      if (currentQuantityInCart + quantity > variant.stock) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (existingItem) {
        await existingItem.update(
          {
            quantity: existingItem.quantity + quantity,
            final_price: (existingItem.quantity + quantity) * price,
          },
          { transaction },
        );
      } else {
        await this.revertBuyNowItems(cart.id, transaction);
        await models.CartItems.create(
          {
            cart_id: cart.id,
            variant_id: variantId || null,
            quantity,
            price,
            final_price: quantity * price,
            discount_amount: 0,
            is_buy_now: true,
          },
          { transaction },
        );
      }

      // Recalculate totals
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      // Return updated cart
      return await this.getCart(userId, sessionId, "buynow");
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateItemQuantity(userId, sessionId, itemId, variantId, quantity) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne(
        {
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
                  attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar"],
                },
              ],
            },
          ],
        },
        { transaction },
      );

      if (!cart) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const cartItem = await models.CartItems.findOne({
        where: { id: itemId, cart_id: cart.id, variant_id: variantId },
        transaction,
      });

      if (!cartItem) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const variant = await models.ProductVariants.findByPk(variantId, { attributes: ["id", "status", "stock"], transaction });

      if (!variant) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PRODUCT_VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (variant.stock < quantity) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PRODUCT_VARIANT_OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const currentQuantityInCart = cartItem ? cartItem.quantity : 0;

      if (currentQuantityInCart < quantity && quantity > variant.stock) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const currentPrice = cartItem.price;
      // Preserve any existing item-level coupon discount when quantity changes
      const existingDiscount = parseFloat(cartItem.discount_amount || 0);
      const finalPrice = Math.max(0, currentPrice * quantity - existingDiscount);

      await cartItem.update({ quantity, final_price: finalPrice.toFixed(2) }, { transaction });

      // Recalculate totals inside the transaction so committed data is consistent
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      // Return updated cart
      return await this.getCart(userId, sessionId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId, sessionId, itemId) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne({
        where: whereClause,
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const cartItem = await models.CartItems.findOne({
        where: { id: itemId, cart_id: cart.id },
        transaction,
      });

      if (!cartItem) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      await cartItem.destroy({ transaction });

      // For scoped coupons: if no remaining items carry a discount, the coupon no
      // longer applies to anything — clear it so the badge doesn't stay showing.
      if (cart.applied_coupon_code && cart.applied_coupon_scope !== "common") {
        const remainingDiscountedItems = await models.CartItems.count({
          where: { cart_id: cart.id, discount_amount: { [require("sequelize").Op.gt]: 0 } },
          transaction,
        });

        if (remainingDiscountedItems === 0) {
          await models.Cart.update(
            { applied_coupon_code: null, coupon_id: null, applied_coupon_scope: null },
            { where: { id: cart.id }, transaction },
          );
        }
      }

      // Recalculate totals
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      // Return updated cart
      return await this.getCart(userId, sessionId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(userId, sessionId) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne({
        where: whereClause,
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.CART_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      await models.CartItems.destroy({
        where: { cart_id: cart.id },
        transaction,
      });

      // Reset totals
      await cart.update(
        {
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          grand_total: 0,
          applied_coupon_code: null,
        },
        { transaction },
      );

      await transaction.commit();

      return {
        id: cart.id,
        items: [],
        subtotal: "0.00",
        discount_total: "0.00",
        tax_total: "0.00",
        grand_total: "0.00",
        item_count: 0,
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Merge guest cart into user cart after login
   */
  static async mergeGuestCart(userId, sessionId) {
    if (!sessionId) {
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      const guestCart = await models.Cart.findOne({
        where: {
          session_id: sessionId,
          status: "active",
          user_id: null,
        },
        include: [{ model: models.CartItems, as: "items" }],
        transaction,
      });

      if (!guestCart) {
        await transaction.commit();
        return;
      }

      if (!guestCart.items || guestCart.items.length === 0) {
        await transaction.commit();
        return;
      }

      const userCart = await this.getOrCreateCart(userId, null, transaction);

      for (const guestItem of guestCart.items) {
        const existingItem = await models.CartItems.findOne({
          where: {
            cart_id: userCart.id,
            product_id: guestItem.product_id,
            variant_id: guestItem.variant_id,
          },
          transaction,
        });

        if (existingItem) {
          await existingItem.update(
            {
              quantity: existingItem.quantity + guestItem.quantity,
            },
            { transaction },
          );
        } else {
          await models.CartItems.create(
            {
              cart_id: userCart.id,
              product_id: guestItem.product_id,
              variant_id: guestItem.variant_id,
              quantity: guestItem.quantity,
              price: guestItem.price,
              final_price: guestItem.final_price,
              discount_amount: guestItem.discount_amount,
            },
            { transaction },
          );
        }
      }

      await guestCart.destroy({ force: true, transaction });

      await ProductServiceHelpers.recalculateCartTotals(userCart.id, transaction);

      // 6️⃣ Commit
      await transaction.commit();
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      throw error;
    }
  }

  /**
   * Get similar products based on the dominant model in the cart
   * GET /api/frontend/cart/similar-products
   */
  static async getSimilarFromCart(userId, sessionId) {
    // 1. Find the active cart
    const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

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
          ],
        },
      ],
    });

    if (!cart || !cart.items?.length) {
      return [];
    }

    // 2. Count model occurrences weighted by quantity → find dominant model
    const modelCounts = {};
    for (const item of cart.items) {
      const modelId = item.variant?.product_model_id;
      if (modelId) {
        modelCounts[modelId] = (modelCounts[modelId] || 0) + item.quantity;
      }
    }

    const dominantModelId = Object.entries(modelCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    if (!dominantModelId) {
      return [];
    }

    const currentCartItemsId = cart.items.map((item) => item.variant_id);

    // 3. Wishlist check for logged-in users
    let wishlistedItems = [];
    if (userId) {
      wishlistedItems = await models.Wishlist.findAll({
        where: { user_id: userId },
        attributes: ["product_variant_id"],
        raw: true,
      });
    }

    // 4. Total variant count for hasMoreVariants flag
    const modelVariantCount = await models.ProductVariants.count({
      where: { product_model_id: dominantModelId, status: true },
    });

    // 5. Fetch up to 6 variants from the dominant model
    const variants = await models.ProductVariants.findAll({
      where: { product_model_id: dominantModelId, status: true, id: { [Op.notIn]: currentCartItemsId } },
      limit: 6,
      attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "product_code", "sku", "product_model_id"],
      include: [
        {
          model: models.ProductModels,
          as: "productModel",
          attributes: ["id", "slug", "title"],
          include: [
            {
              model: models.ProductBase,
              as: "product",
              attributes: ["id", "slug"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "category",
                  attributes: ["id", "name", "name_ar"],
                },
              ],
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

    // 6. Transform to standard product card format
    return variants.map((item) => {
      const json = item.toJSON();

      const formattedAttributes = (json?.variant_attributes || []).map((va) => ({
        code: va?.ProductAttribute?.code,
        slug: va?.ProductAttribute?.slug,
        values: [{ slug: va?.AttributeValue?.slug, value: va?.AttributeValue?.value }],
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
        variants_available: json?.has_more_items,
        hasMoreVariants: modelVariantCount > 1,
        isWishlisted: isItemWishListed(json?.id, wishlistedItems),
        price: json?.price,
        stock: json?.stock,
        category_name: json?.productModel?.product?.category?.name || null,
        category_ar: json?.productModel?.product?.category?.name_ar || null,
        variant_attributes: json?.variant_attributes,
        query_params: generateQueryParams(variantSku, modelSlug, formattedAttributes),
      };
    });
  }
}

module.exports = CartService;
