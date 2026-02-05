const { models, sequelize } = require("../../../../database/models/index.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");

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
   * Calculate and update cart totals
   */
  static async recalculateCartTotals(cartId, transaction = null) {
    const cartItems = await models.CartItems.findAll({
      where: { cart_id: cartId },
      transaction,
    });

    let subtotal = 0;
    let discountTotal = 0;

    for (const item of cartItems) {
      const itemTotal = parseFloat(item.price) * item.quantity;
      const itemDiscount = parseFloat(item.discount_amount) * item.quantity;
      subtotal += itemTotal;
      discountTotal += itemDiscount;
    }

    const grandTotal = subtotal - discountTotal;

    await models.Cart.update(
      {
        subtotal: subtotal.toFixed(2),
        discount_total: discountTotal.toFixed(2),
        grand_total: grandTotal.toFixed(2),
      },
      {
        where: { id: cartId },
        transaction,
      },
    );

    return { subtotal, discountTotal, grandTotal };
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
      })),
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      grand_total: cart.grand_total,
      applied_coupon_code: cart.applied_coupon_code,
      item_count: itemCount,
    };
  }
}

module.exports = CheckOutService;
