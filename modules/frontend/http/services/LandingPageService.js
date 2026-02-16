const { Op } = require("sequelize");
const { models } = require("../../../../database/models");

const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const cacheKey = cacheKeys.landingPageDetails;

const buildProductVariantInclude = () => [
  {
    model: models.ProductModels,
    as: "productModel", // must match your association alias
    attributes: ["id", "title"],
    required: false,
    include: [
      {
        model: models.ProductBase,
        as: "product",
        required: false,
        include: [
          {
            model: models.ProductCategory,
            as: "category",
            required: false,
            include: [
              {
                model: models.ProductCategory,
                as: "parent",
                required: false,
              },
              {
                model: models.ProductCategory,
                as: "children",
                required: false,
              },
            ],
          },
        ],
      },
    ],
  },
];

class LandingPageService {
  static async getData(req, res) {
    try {
      const { slug } = req.query;

      if (!slug) {
        throw new Error("Slug is required");
      }
      // 1️⃣ Fetch landing page WITH associated product types
      const landingPageInstance = await models.LandingPage.findOne({
        where: { slug },
        include: [
          {
            model: models.ProductTypes,
            as: "productTypes",
            where: { status: true },
            required: false,
            order: [["sort_order", "ASC"]],
          },
        ],
      });

      if (!landingPageInstance) {
        throw new Error("Landing page not found");
      }

      const landingPage = landingPageInstance.get({ plain: true });

      const productTypes = landingPage.productTypes || [];

      // 2️⃣ Collect variant IDs only from associated product types
      const allVariantIds = [
        ...new Set(
          productTypes.flatMap((type) =>
            Array.isArray(type.product_variants)
              ? type.product_variants.map(Number)
              : [],
          ),
        ),
      ];

      let variantsMap = {};

      // 3️⃣ Fetch all variants in one query
      if (allVariantIds.length > 0) {
        const variants = await models.ProductVariants.findAll({
          where: { id: { [Op.in]: allVariantIds } },
          attributes: ["id", "sku", "title"],
          include: buildProductVariantInclude(),
        });

        variantsMap = variants.reduce((acc, variant) => {
          acc[variant.id] = variant.get({ plain: true });
          return acc;
        }, {});
      }

      // 4️⃣ Attach variants to ONLY associated product types
      landingPage.productTypes = productTypes.map((type) => {
        const variantIds = Array.isArray(type.product_variants)
          ? type.product_variants.map(Number)
          : [];

        return {
          ...type,
          product_variants_data: variantIds
            .map((id) => variantsMap[id])
            .filter(Boolean),
        };
      });

      const result = landingPage;


      return {
        fromCache: false,
        message: "Data fetched successfully",
        data: result,
      };
    } catch (error) {
      console.error("Landing page error:", error);
      throw new Error(error.message);
    }
  }
}

module.exports = LandingPageService;
