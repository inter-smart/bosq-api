const crypto = require("crypto");
const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const ProductServiceHelpers = require("../traits/products.js");
const { isItemWishListed, generateQueryParams } = require("../traits/dataManipulations/product/product.js");
const { Op } = require("sequelize");
const { type } = require("os");
const logger = require("../../../../config/logger.js");

const MINIMUM_CART_SUBTOTAL = 500;

class CartService {
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

    return {
      overallDeliveryCharge,
      requiresSalesContact,
      itemsCharges,
    };
  }

  /**
   * Get or create cart for user/guest
   */
  static async getOrCreateCart(userId, sessionId, type, transaction = null) {
    const whereClause = userId ? { user_id: userId, status: "active", type } : { session_id: sessionId, status: "active", user_id: null, type };

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
          type,
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
      force: true,
      transaction,
    });
  }

  /**
   * Get cart with items
   */
  static async getCart(userId, sessionId) {
    const transaction = await sequelize.transaction();
    try {
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
        order: [[{ model: models.CartItems, as: "items" }, "id", "ASC"]],
        transaction,
      });

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

      await ProductServiceHelpers.syncCartItemPrices(cart, transaction);

      // Reload cart with fresh data after price sync
      await cart.reload({
        order: [[{ model: models.CartItems, as: "items" }, "id", "ASC"]],
        include: [
          {
            model: models.CartItems,
            as: "items",
            include: [
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "price", "media_path", "stock", "title", "title_ar", "design_title", "design_title_ar"],
                include: [
                  {
                    model: models.ProductModels,
                    as: "productModel",
                    attributes: ["id"],
                    include: [
                      {
                        model: models.ProductBase,
                        as: "product",
                        attributes: ["id", "slug"],
                      },
                    ],
                  },
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
          },
        ],
        transaction,
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

      // let overallDeliveryCharge = isChargeCalculationNeeded ? 0 : 100;
      let overallDeliveryCharge = 0;
      let requiresSalesContact = false;
      let itemsCharges = [];

      if (isChargeCalculationNeeded) {
        const shippingChargeData = await this.calculateCartShippingCharge(cart, stateId);
        overallDeliveryCharge = shippingChargeData.overallDeliveryCharge;
        requiresSalesContact = shippingChargeData.requiresSalesContact;
        itemsCharges = shippingChargeData.itemsCharges;
      }

      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      await transaction.commit();

      const formattedCartData = cart.items.map((data) => {
        const item = data.toJSON();

        const formattedAttributes = (item?.variant?.variant_attributes || []).map((va) => ({
          code: va?.ProductAttribute?.code,
          slug: va?.ProductAttribute?.slug,
          values: [
            {
              slug: va?.AttributeValue?.slug,
              value: va?.AttributeValue?.value,
            },
          ],
        }));
        const variantSku = item?.variant?.sku;
        return {
          id: item.id,
          base_slug: item?.variant?.productModel?.product?.slug,
          variant_id: item?.variant_id,
          title: item?.variant?.title,
          title_ar: item?.variant?.title_ar,
          media_path: generateImageUrl(item?.variant?.media_path),
          design_title: item?.variant?.design_title,
          design_title_ar: item?.variant?.design_title_ar,
          quantity: item?.quantity,
          price: item?.price,
          discount_amount: item?.discount_amount,
          line_total: (parseFloat(item?.price || 0) * item?.quantity || 0).toFixed(2),
          is_sold_out: item?.variant ? item?.variant.stock < item?.quantity : false,
          product: item?.product,
          variant: item?.variant,
          query_params: generateQueryParams(variantSku, formattedAttributes),
        };
      });

      return {
        id: cart.id,
        items: formattedCartData,
        subtotal: parseFloat(cart?.subtotal),
        discount_total: cart?.discount_total,
        tax_total: cart?.tax_total,
        grand_total: parseFloat(cart?.grand_total) + parseFloat(overallDeliveryCharge),
        applied_coupon_code: cart?.applied_coupon_code,
        item_count: itemCount,
        shipping_charge: overallDeliveryCharge,
        requires_sales_contact: requiresSalesContact,
        items_charges: itemsCharges,
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

      const cart = await this.getOrCreateCart(userId, sessionId, "cart", transaction);

      const existingItem = await models.CartItems.findOne({
        where: {
          cart_id: cart.id,
          variant_id: variantId || null,
          is_buy_now: false,
        },
        transaction,
      });

      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

      logger.info(`STOCK ----- ${variant.stock}`);
      logger.info(`QUANTITY ----- ${quantity}`);
      logger.info(`CURRENT QTY IN CART ----- ${currentQuantityInCart}`);

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
   * Add multiple items to cart (qty 1 each) — used for "Frequently Bought Together"
   */
  static async addMultipleItems(userId, sessionId, variantIds = []) {
    const transaction = await sequelize.transaction();

    try {
      const cart = await this.getOrCreateCart(userId, sessionId, "cart", transaction);

      const skipped = [];

      for (const variantId of variantIds) {
        const variant = await models.ProductVariants.findOne({
          attributes: ["id", "price", "status", "stock"],
          where: { id: variantId, status: true },
          transaction,
        });

        if (!variant) {
          skipped.push(variantId);
          continue;
        }

        const existingItem = await models.CartItems.findOne({
          where: { cart_id: cart.id, variant_id: variantId },
          transaction,
        });

        const currentQty = existingItem ? existingItem.quantity : 0;

        if (variant.stock < 1 || currentQty + 1 > variant.stock) {
          skipped.push(variantId);
          continue;
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

      const updatedCart = await this.getCart(userId, sessionId);

      return { skipped, updatedCharge: updatedCart?.shipping_charge || 0 };
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

      const cart = await this.getOrCreateCart(userId, sessionId, "buynow", transaction);

      if (quantity > variant.stock) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OUT_OF_STOCK, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

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

      // Recalculate totals
      await ProductServiceHelpers.recalculateCartTotals(cart.id, transaction);

      await transaction.commit();

      return;

      // Return updated cart
      // return await this.getCart(userId, sessionId, "buynow");
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
        order: [[{ model: models.CartItems, as: "items" }, "id", "ASC"]],
        transaction,
      });

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
      const whereClause = userId
        ? { user_id: userId, status: "active", type: "cart" }
        : { session_id: sessionId, status: "active", user_id: null, type: "cart" };

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

      await cartItem.destroy({ force: true, transaction });

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
      const whereClause = userId
        ? { user_id: userId, status: "active", type: "cart" }
        : { session_id: sessionId, status: "active", user_id: null, type: "cart" };

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
          type: "cart",
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

      const userCart = await this.getOrCreateCart(userId, null, "cart", transaction);

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
      const activeBuyNowCart = await models.Cart.findOne({
        where: { session_id: sessionId, user_id: null, status: "active", type: "buynow" },
        transaction,
      });

      if (activeBuyNowCart) {
        await activeBuyNowCart.destroy({ force: true, transaction });
      }

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
   * Copy user cart items to a new guest cart (call before logout when user wants to keep cart)
   * Returns the new guest sessionId, or null if cart is empty
   */
  static async keepCartAsGuest(userId) {
    const transaction = await sequelize.transaction();

    try {
      const userCart = await models.Cart.findOne({
        where: { user_id: userId, status: "active", type: "cart" },
        include: [{ model: models.CartItems, as: "items", where: { is_buy_now: false }, required: false }],
        transaction,
      });

      if (!userCart || !userCart.items || userCart.items.length === 0) {
        await transaction.commit();
        return null;
      }

      const sessionId = crypto.randomUUID();

      const guestCart = await models.Cart.create(
        {
          user_id: null,
          session_id: sessionId,
          status: "active",
          currency: userCart.currency || "AED",
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          grand_total: 0,
          type: "cart",
        },
        { transaction },
      );

      for (const item of userCart.items) {
        await models.CartItems.create(
          {
            cart_id: guestCart.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
            final_price: item.final_price,
            discount_amount: item.discount_amount,
          },
          { transaction },
        );
      }

      await ProductServiceHelpers.recalculateCartTotals(guestCart.id, transaction);

      await transaction.commit();
      return sessionId;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Get matching products based on the most repeated category in the cart
   * GET /api/frontend/cart/matching-products
   */
  static async getMatchingProducts(userId, sessionId) {
    // 1. Find active cart with items and their variant categories
    const whereClause = userId
      ? { user_id: userId, status: "active", type: "cart" }
      : { session_id: sessionId, status: "active", user_id: null, type: "cart" };

    const cart = await models.Cart.findOne({
      where: whereClause,
      include: [
        {
          model: models.CartItems,
          as: "items",
          attributes: ["id", "variant_id", "quantity"],
          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: ["id"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "categories",
                  attributes: ["id"],
                  through: { attributes: [] },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart || !cart.items?.length) return [];

    // 2. Count category occurrences weighted by quantity
    const categoryCounts = {};
    for (const item of cart.items) {
      for (const cat of item.variant?.categories || []) {
        categoryCounts[cat.id] = (categoryCounts[cat.id] || 0) + item.quantity;
      }
    }

    if (!Object.keys(categoryCounts).length) return [];

    // 3. Find the most repeated category
    const dominantCategoryId = parseInt(Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0][0]);

    const cartVariantIds = cart.items.map((i) => i.variant_id);

    // 4. Get variant IDs in the dominant category, excluding cart items
    const junctionRows = await models.ProductVariantCategories.findAll({
      where: { category_id: dominantCategoryId },
      attributes: ["product_variant_id"],
      raw: true,
    });

    const eligibleIds = junctionRows.map((r) => r.product_variant_id).filter((id) => !cartVariantIds.includes(id));

    if (!eligibleIds.length) return [];

    // 5. Fetch up to 3 matching variants with full details
    const rawItems = await models.ProductVariants.findAll({
      where: { id: { [Op.in]: eligibleIds }, status: true },
      limit: 3,
      attributes: ["id", "title", "title_ar", "media_path", "hover_media_path", "price", "stock", "product_code", "sku"],
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
          attributes: ["id", "slug"],
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

    // 6. Format to standard product card shape
    return rawItems.map((item) => {
      const json = item.toJSON();

      const formattedAttributes = (json?.variant_attributes || []).map((va) => ({
        code: va?.ProductAttribute?.code,
        slug: va?.ProductAttribute?.slug,
        values: [{ slug: va?.AttributeValue?.slug, value: va?.AttributeValue?.value }],
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
  }

  /**
   * Get similar products based on the dominant model in the cart
   * GET /api/frontend/cart/similar-products
   */
  static async getSimilarFromCart(userId, sessionId) {
    // 1. Find the active cart
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
        variant_attributes: json?.variant_attributes,
        categories: json?.categories.map((c) => ({
          id: c.id,
          name: c.name,
          name_ar: c.name_ar,
          slug: c.slug,
        })),
        query_params: generateQueryParams(variantSku, formattedAttributes),
      };
    });
  }
}

module.exports = CartService;
