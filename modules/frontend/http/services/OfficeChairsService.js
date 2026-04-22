const { Op } = require("sequelize");
const { models, sequelize } = require("../../../../database/models");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { generateQueryParams, isItemWishListed } = require("../traits/dataManipulations/product/product");
const { buildOtherMetaData } = require("../traits/dataManipulations/common");

const buildVariantIncludes = () => [
  {
    model: models.ProductModels,
    as: "productModel",
    attributes: ["id", "title"],
    required: false,
    include: [
      {
        model: models.ProductBase,
        as: "product",
        attributes: ["id", "title", "title_ar", "slug"],
        required: false,
      },
    ],
  },
  {
    model: models.ProductCategory,
    as: "categories",
    through: { attributes: [] },
    attributes: ["id", "name", "name_ar"],
    required: false,
  },
  {
    model: models.AttributeValues,
    as: "attribute_values",
    attributes: ["id", "value", "value_ar", "media_path", "slug"],
    required: false,
    include: [
      {
        model: models.ProductAttribute,
        as: "attribute",
        attributes: ["id", "name", "name_ar", "code", "slug"],
        required: false,
      },
    ],
  },
];

const transformVariant = (variant, variantsCount = 0, wishlistedItems = []) => {
  const colorValues = (variant.attribute_values ?? [])
    .filter((av) => av.attribute?.code === "COLOR")
    .map((av) => av.value);

  const formattedAttributes = (variant.attribute_values ?? []).map((av) => ({
    slug: av.attribute?.slug,
    values: [{ slug: av.slug, value: av.value }],
  }));

  return {
    id: variant.id,
    media: {
      type: "image",
      path: generateImageUrl(variant.media_path) ?? null,
      alt: variant.title ?? "",
      alt_ar: variant.title_ar ?? "",
    },
    hoverMedia: variant.hover_media_path
      ? {
        type: "image",
        path: generateImageUrl(variant.hover_media_path),
        alt: variant.title ?? "",
        alt_ar: variant.title_ar ?? "",
      }
      : null,
    isStock: (variant.stock ?? 0) > 0,
    name: variant.title ?? "",
    name_ar: variant.title_ar ?? "",
    slug: variant.productModel?.product?.slug
      ? `/products/${variant.productModel.product.slug}`
      : null,
    price: parseFloat(variant.price) ?? 0,
    category: variant.categories?.[0]?.name ?? null,
    category_ar: variant.categories?.[0]?.name_ar ?? null,
    colorVariant: colorValues.length > 0 ? colorValues : null,
    shortDescription: variant.description ?? null,
    shortDescription_ar: variant.description_ar ?? null,
    description: variant.details ?? null,
    description_ar: variant.details_ar ?? null,
    hasMoreVariants: variantsCount > 1,
    isWishlisted: isItemWishListed(variant.id, wishlistedItems),
    variant_attributes: (variant.attribute_values ?? []).map((av) => ({
      id: av.id,
      attribute_id: av.attribute?.id,
      attribute_value_id: av.id,
      attribute_name: av.attribute?.name,
      attribute_name_ar: av.attribute?.name_ar,
      attribute_code: av.attribute?.code,
      attribute_slug: av.attribute?.slug,
      value: av.value,
      value_ar: av.value_ar,
      value_slug: av.slug,
    })),
    query_params: generateQueryParams(variant.sku, formattedAttributes),
  };
};

const transformHeroData = (lp) => ({
  title: lp.title,
  title_ar: lp.title_ar,
  heroTitle: lp.title,
  heroTitle_ar: lp.title_ar,
  heroDescription: lp.description ?? null,
  heroDescription_ar: lp.description_ar ?? null,
  media: {
    type: "image",
    desktop: {
      path: generateImageUrl(lp.media_desktop_path) ?? null,
      alt: lp.media_alt ?? "",
    },
    mobile: {
      path: generateImageUrl(lp.media_mobile_path) ?? generateImageUrl(lp.media_desktop_path) ?? null,
      alt: lp.media_alt_ar ?? lp.media_alt ?? "",
    },
    cta: {
      label: lp.button_label ?? null,
      label_ar: lp.button_label_ar ?? null,
      href: lp.link ?? `/${lp.slug}`,
    },
  },
});

const transformListingData = (pt, lp, variantsMap, variantCountsMap = {}, wishlistedItems = []) => {
  const variantIds = Array.isArray(pt.product_variants)
    ? pt.product_variants.map(Number)
    : [];

  const products = variantIds
    .map((id) => variantsMap[id])
    .filter(Boolean)
    .map((v) => transformVariant(v, variantCountsMap[v.product_model_id] || 0, wishlistedItems));

  return {
    heroImage: generateImageUrl(pt.media_path) ?? null,
    heroTitle: pt.title,
    heroTitle_ar: pt.title_ar,
    description: pt.description ?? "",
    description_ar: pt.description_ar ?? "",
    features: pt.features ?? "",
    features_ar: pt.features_ar ?? "",
    cta: {
      label: pt.button ?? "",
      label_ar: pt.button_ar ?? "",
      href: pt.link ?? null,
    },
    product: products,
  };
};

class OfficeChairsService {
  static async getData(req) {
    try {
      const { slug } = req.query;

      if (!slug) {
        throw new Error("Slug is required");
      }

      const landingPageInstance = await models.LandingPage.findOne({
        where: { slug, status: true },
        include: [
          {
            model: models.ProductTypes,
            as: "productTypes",
            where: { status: true },
            required: false,
          },
        ],
        order:[
          [{model: models.ProductTypes, as: "productTypes"}, "sort_order", "ASC"]
        ]
      });

      if (!landingPageInstance) {
        throw new Error("Landing page not found");
      }

      const lp = landingPageInstance.get({ plain: true });
      const productTypes = lp.productTypes ?? [];

      const allVariantIds = [
        ...new Set(
          productTypes.flatMap((pt) =>
            Array.isArray(pt.product_variants)
              ? pt.product_variants.map(Number)
              : []
          )
        ),
      ];

      let variantsMap = {};

      if (allVariantIds.length > 0) {
        const variants = await models.ProductVariants.findAll({
          where: { id: { [Op.in]: allVariantIds }, status: true },
          include: buildVariantIncludes(),
        });

        variantsMap = variants.reduce((acc, v) => {
          acc[v.id] = v.get({ plain: true });
          return acc;
        }, {});
      }

      const userId = req?.cartOwner?.id || null;
      const isLoggedInUser = req?.cartOwner?.type === "user" && !!userId;

      let wishlistedItems = [];
      if (isLoggedInUser) {
        wishlistedItems = await models.Wishlist.findAll({
          where: { user_id: userId },
          attributes: ["product_variant_id"],
          raw: true,
        });
      }

      const heroData = transformHeroData(lp);
      const metaData = buildOtherMetaData(lp);
      const productModelIds = [
        ...new Set(
          Object.values(variantsMap)
            .map((v) => v.product_model_id)
            .filter(Boolean)
        ),
      ];

      let variantCountsMap = {};
      if (productModelIds.length > 0) {
        const countSQL = `
        SELECT "product_model_id", COUNT("id") AS "variant_count"
        FROM   "product_variants"
        WHERE  "product_model_id" IN (:productModelIds)
          AND  "status" = true
          AND  "deletedAt" IS NULL
        GROUP  BY "product_model_id"
      `;
        const variantCounts = await sequelize.query(countSQL, {
          replacements: { productModelIds },
          type: sequelize.QueryTypes.SELECT,
        });
        variantCountsMap = variantCounts.reduce((acc, item) => {
          acc[item.product_model_id] = parseInt(item.variant_count, 10);
          return acc;
        }, {});
      }

      const listingData = productTypes.map((pt) =>
        transformListingData(pt, lp, variantsMap, variantCountsMap, wishlistedItems)
      );

      return {
        fromCache: false,
        message: "Data fetched successfully",
        data: { heroData, listingData, metaData },
      };
    } catch (error) {
      console.error("OfficeChairsService error:", error);
      throw new Error(error.message);
    }
  }
}

module.exports = OfficeChairsService;
