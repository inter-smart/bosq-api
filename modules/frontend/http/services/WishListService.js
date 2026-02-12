const { models } = require("../../../../database/models/index.js");
const { generateImageUrl } = require("../../traits/imageUrlHelper.js");
const {
  generateQueryParams,
} = require("../traits/dataManipulations/product/product.js");

const DataModel = models.Wishlist;

class WishListService {
  static async addToWishlist(req, res) {
    try {
      const userId = req.auth.id;
      const { variantId } = req.query;

      console.log(userId);
      console.log(variantId);

      if (!variantId) {
        throw new Error("variantId is required");
      }

      const user = await models.Users.findByPk(userId);

      if (!user) {
        throw new Error("user not found");
      }

      const variant = await models.ProductVariants.findByPk(variantId);

      if (!variant) {
        throw new Error("variant not found");
      }

      const wishlist = await DataModel.create({
        user_id: userId,
        product_variant_id: variantId,
      });

      return wishlist;
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new Error("Already in wishlist");
      }

      throw new Error(error.message);
    }
  }

  static async getWishlist(req) {
    try {
      const userId = req.auth.id;
      const { page = 1, limit = 12 } = req.query;

      if (!userId) {
        throw new Error("userId is required");
      }

      if (!(await models.Users.findByPk(userId))) {
        throw new Error("user not found");
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      const { rows: wishlistItems, count: totalCount } =
        await DataModel.findAndCountAll({
          where: { user_id: userId },
          limit: limitNum,
          offset,
          include: [
            {
              model: models.ProductVariants,
              as: "variant",
              attributes: [
                "id",
                "title",
                "title_ar",
                "media_path",
                "hover_media_path",
                "price",
                "stock",
                "product_code",
                "sku",
                "product_model_id",
              ],
              include: [
                {
                  model: models.AttributeValues,
                  as: "attribute_values",
                  attributes: ["id", "value", "value_ar", "slug", "media_path"],
                  through: { attributes: [] },
                  include: [
                    {
                      model: models.ProductAttribute,
                      as: "attribute",
                      attributes: ["id", "name", "name_ar", "code", "slug"],
                    },
                  ],
                },
                {
                  model: models.ProductModels,
                  as: "productModel",
                  attributes: ["id", "slug"],
                  include: [
                    {
                      model: models.ProductBase,
                      as: "product",
                      attributes: [
                        "id",
                        "category_id",
                        "slug",
                        "description",
                        "description_ar",
                        "details",
                        "details_ar",
                      ],
                      include: [
                        {
                          model: models.ProductCategory,
                          as: "category",
                          attributes: ["id", "name_ar", "name"],
                        },
                        {
                          model: models.ProductSectors,
                          as: "sectors",
                          attributes: ["id", "name", "name_ar"],
                          through: { attributes: [] },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          distinct: true,
        });

      const transformedData = wishlistItems.map((item) => {
        const json = item.toJSON();
        const variant = json.variant || {};
        const productBase = variant.productModel?.product || {};
        const attributeValues = variant.attribute_values || [];

        const modelSlug = variant.productModel?.slug;
        const variantSku = variant.sku;

        // Format attributes for query params generation
        const formattedAttributes = attributeValues.map((av) => ({
          code: av.attribute?.code,
          slug: av.attribute?.slug,
          values: [{ slug: av.slug, value: av.value }],
        }));

        return {

          id: json.id,
          variant_id: variant.id,
          isWishlisted: true,
          isStock: variant.stock > 0,
          stock: variant.stock,
          media_path: generateImageUrl(variant.media_path),
          title: variant.title,
          title_ar: variant.title_ar,
          colorVariant: ["#bababa", "#333333", "#8db600", "#ff0000", "#000000"],
          hoverMedia: variant.hover_media_path
            ? {
              type: "image",
              path: generateImageUrl(variant.hover_media_path),
              alt: variant.title,
            }
            : null,
          // name: variant.title,
          base_slug: `${productBase.slug}`,
          price: variant.price,
          query_params: generateQueryParams(
            variantSku,
            modelSlug,
            formattedAttributes,
          ),
        };
      });

      return {
        data: {
          wishlistData: {
            no_of_items: totalCount,
            items: transformedData,
            pagination: {
              total: totalCount,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
              hasPrevPage: pageNum > 1,
            },
          },
        },
        message: "Wishlist data fetched successfully",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // At the top of your controller file - import the model

  static async removeFromWishlist(req, res) {
    try {
      const userId = req.auth.id;
      const { id: variantId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required"
        });
      }

      if (!variantId) {
        return res.status(400).json({
          success: false,
          message: "variantId is required"
        });
      }

      // Use UsersWishList model instead of DataModel
      const deletedCount = await models.Wishlist.destroy({
        where: {
          user_id: userId,
          product_variant_id: variantId,
        },
      });

      // Check if anything was actually deleted
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Wishlist item not found"
        });
      }

      // Send success response
      return res.status(200).json({
        success: true,
        message: "Item removed from wishlist successfully",
        deletedCount
      });

    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove item from wishlist",
        error: error.message
      });
    }
  }
}

module.exports = WishListService;
