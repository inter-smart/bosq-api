const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const ProductServiceHelpers = require("../traits/products.js");

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

      // await ProductServiceHelpers.validateCoupon(cart);

      const priceChanged = await ProductServiceHelpers.syncCartItemPrices(cart, transaction);


      // Reload cart with fresh data after price sync
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
                  attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar"],
                },
              ],
            },
          ],
          transaction,
        });
      }

      console.log("CART FROM GET", JSON.stringify(cart, null, 2));

      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      await transaction.commit();

      return {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.variant.title,
          media_path: generateImageUrl(item.variant.media_path),
          quantity: item.quantity,
          price: item.price,
          discount_amount: item.discount_amount,
          line_total: (parseFloat(item.price) * item.quantity).toFixed(2),
          is_sold_out: item.variant ? item.variant.stock < item.quantity : false,
          product: item.product,
          variant: item.variant,
        })),
        subtotal: cart.subtotal,
        discount_total: cart.discount_total,
        tax_total: cart.tax_total,
        grand_total: cart.grand_total,
        applied_coupon_code: cart.applied_coupon_code,
        item_count: itemCount,
      };
    } catch (error) {
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
        throw ErrorHandler.createError("Product variant not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (variant.stock < quantity) {
        throw ErrorHandler.createError("Out of stock limit", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      let price = variant.price;

      // Get or create cart
      const cart = await this.getOrCreateCart(userId, sessionId, transaction);

      // Check if item already exists in cart
      const existingItem = await models.CartItems.findOne({
        where: {
          cart_id: cart.id,
          variant_id: variantId || null,
        },
        transaction,
      });

      if (existingItem) {
        // Update quantity
        await existingItem.update(
          {
            quantity: existingItem.quantity + quantity,
          },
          { transaction },
        );
      } else {
        // Create new cart item
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
   * Update cart item quantity
   */
  static async updateItemQuantity(userId, sessionId, itemId, variantId, quantity) {
    const transaction = await sequelize.transaction();

    try {
      const whereClause = userId ? { user_id: userId, status: "active" } : { session_id: sessionId, status: "active", user_id: null };

      const cart = await models.Cart.findOne({
        where: whereClause,
        transaction,
      });

      if (!cart) {
        throw ErrorHandler.createError("Cart not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const cartItem = await models.CartItems.findOne({
        where: { id: itemId, cart_id: cart.id, variant_id: variantId },
        transaction,
      });

      if (!cartItem) {
        throw ErrorHandler.createError("Cart item not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const variant = await models.ProductVariants.findByPk(variantId, { attributes: ["id", "status", "stock"], transaction });

      if (!variant) {
        throw ErrorHandler.createError("Product variant not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (variant.stock < quantity) {
        throw ErrorHandler.createError("Product variant out of stock", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      await cartItem.update({ quantity }, { transaction });

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
        throw ErrorHandler.createError("Cart not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      const cartItem = await models.CartItems.findOne({
        where: { id: itemId, cart_id: cart.id },
        transaction,
      });

      if (!cartItem) {
        throw ErrorHandler.createError("Cart item not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      await cartItem.destroy({ transaction });

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
        throw ErrorHandler.createError("Cart not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
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
}

module.exports = CartService;
