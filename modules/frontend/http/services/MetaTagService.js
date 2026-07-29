const { Op, literal } = require("sequelize");
const { models } = require("../../../../database/models");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { ErrorHandler } = require("../traits/errorHandler");

const defaultProductMeta = {
  en: {
    meta_title: "BOSQ",
    meta_description: "Welcome to BOSQ",
    meta_keywords: "BOSQ",
    other_meta: "<meta name='author' content='BOSQ'>",
  },
  ar: {
    meta_title: "بوسك",
    meta_description: "مرحبا بكم في بوسك",
    meta_keywords: "بوسك",
    other_meta: "<meta name='author' content='بوسك'>",
  },
};

class MetaTagService {
  static async index(page, language = "en") {
    try {
      // Fetch record from DB
      const record = await models.MetaTags.findOne({ where: { page } });

      // fallback default meta
      const defaultMeta = {
        en: {
          meta_title: "BOSQ",
          meta_description: "Welcome to BOSQ",
          meta_keywords: "BOSQ",
          other_meta: "<meta name='author' content='BOSQ'>",
          canonical_url: "/",
        },
        ar: {
          meta_title: "بوسك",
          meta_description: "مرحبا بكم في بوسك",
          meta_keywords: "بوسك",
          other_meta: "<meta name='author' content='بوسك'>",
          canonical_url: "/ar",
        },
      };

      // If no record in DB, return default
      if (!record) {
        return defaultMeta[language] || defaultMeta.en;
      }

      const data = record.toJSON();

      // Build meta based on requested language
      const meta = {
        meta_title:
          language === "ar" ? data.meta_title_ar || data.meta_title || defaultMeta.ar.meta_title : data.meta_title || defaultMeta.en.meta_title,
        meta_description:
          language === "ar"
            ? data.meta_description_ar || data.meta_description || defaultMeta.ar.meta_description
            : data.meta_description || defaultMeta.en.meta_description,
        meta_keywords:
          language === "ar"
            ? data.meta_keywords_ar || data.meta_keywords || defaultMeta.ar.meta_keywords
            : data.meta_keywords || defaultMeta.en.meta_keywords,
        other_meta:
          language === "ar" ? data.other_meta_ar || data.other_meta || defaultMeta.ar.other_meta : data.other_meta || defaultMeta.en.other_meta,
      };

      return {
        data: meta,
        fromCache: false,
        message: "FAQs fetched successfully",
      };
    } catch (error) {
      // Do NOT pass null here; just throw the error
      throw error;
    }
  }

  static async getMetaForProduct(params, lang = "en") {
    const { slug, variantSku = null, model = null } = params;

    const isAr = lang === "ar";
    const fallback = defaultProductMeta[isAr ? "ar" : "en"];

    const filters = Object.entries(params)
      .filter(([key]) => key.startsWith("attr["))
      .reduce((acc, [key, value]) => {
        const attrSlug = key.match(/^attr\[(.+)\]$/)?.[1];
        if (attrSlug) acc[attrSlug] = value;
        return acc;
      }, {});

    const filterEntries = Object.entries(filters);
    const isModelAndFilters = model && filterEntries.length > 0;

    try {
      const { data: baseData } = await this.getProductBaseData(slug);

      if (!baseData) {
        return null;
      }

      let initialVariant = null;

      // -----------------------------------------------------
      // CASE 1 : Variant SKU provided
      // -----------------------------------------------------
      if (variantSku) {
        const productData = await models.ProductVariants.findOne({
          where: { sku: variantSku, status: true },
          attributes: ["id", "sku", "title", "title_ar", "media_path"],
        });

        if (!productData) {
          return null;
        }

        const variant = productData.toJSON();

        initialVariant = {
          id: variant.id,
          title: variant.title,
          title_ar: variant.title_ar,
          slug: variant.sku,
          variant_image: generateImageUrl(variant.media_path),
        };
      }

      // -----------------------------------------------------
      // CASE 2 : Model selected but no filters
      // -----------------------------------------------------
      else if (model && !isModelAndFilters) {
        const productModelData = await models.ProductModels.findOne({
          where: {
            product_id: baseData.id,
            slug: model,
            status: true,
          },
          attributes: ["id", "code", "title", "slug", "media_path", "title_ar"],
          include: [
            {
              association: "variants",
              where: {
                status: true,
              },
              required: false,
              attributes: ["id", "sku", "title", "title_ar", "media_path"],
            },
          ],
        });

        if (!productModelData) {
          return null;
        }

        const { variants = [] } = productModelData.toJSON();

        const variant = variants[0];

        if (variant) {
          initialVariant = {
            id: variant.id,
            title: variant.title,
            title_ar: variant.title_ar,
            slug: variant.sku,
            variant_image: generateImageUrl(variant.media_path),
          };
        }
      }

      // -----------------------------------------------------
      // CASE 3 : Attribute filters
      // -----------------------------------------------------
      else {
        const attributeFilterConditions = [];

        for (const [attributeSlug, valueSlug] of filterEntries) {
          const attributeValue = await models.AttributeValues.findOne({
            where: {
              slug: valueSlug,
            },
            attributes: ["id", "attribute_id"],
            include: [
              {
                association: "attribute",
                where: {
                  slug: attributeSlug,
                },
                attributes: ["id"],
              },
            ],
          });

          if (attributeValue) {
            attributeFilterConditions.push({
              attribute_id: attributeValue.attribute_id,
              attribute_value_id: attributeValue.id,
            });
          }
        }

        const whereClause = {
          status: true,
        };

        if (attributeFilterConditions.length > 0) {
          whereClause[Op.and] = attributeFilterConditions.map((cond) =>
            literal(`EXISTS (
            SELECT 1
            FROM "product_variant_attributes"
            WHERE "product_variant_attributes"."product_variant_id" = "ProductVariants"."id"
              AND "product_variant_attributes"."attribute_id" = ${cond.attribute_id}
              AND "product_variant_attributes"."attribute_value_id" = ${cond.attribute_value_id}
              AND "product_variant_attributes"."deletedAt" IS NULL
          )`),
          );
        }

        const variantData = await models.ProductVariants.findOne({
          where: whereClause,
          attributes: ["id", "sku", "title", "title_ar", "media_path"],
          include: [
            {
              association: "productModel",
              required: true,
              where: {
                product_id: baseData.id,
                status: true,
              },
              attributes: [],
            },
          ],
        });

        if (variantData) {
          const variant = variantData.toJSON();

          initialVariant = {
            id: variant.id,
            title: variant.title,
            title_ar: variant.title_ar,
            slug: variant.sku,
            variant_image: generateImageUrl(variant.media_path),
          };
        }
      }

      if (!initialVariant) {
        return {
          data: null,
          message: "Data fetched",
        };
      }

      const metaData = await models.ProductMeta.findOne({
        where: {
          product_variant_id: initialVariant.id,
        },
        attributes: [
          "id",
          "meta_title",
          "meta_title_ar",
          "meta_description",
          "meta_description_ar",
          "meta_keywords",
          "meta_keywords_ar",
          "other_meta",
          "other_meta_ar",
        ],
      });

      const data = metaData ? metaData.toJSON() : {};

      // Build meta based on requested language, falling back to the other
      // language's value, then the generic default, same pattern as index().
      const meta = {
        meta_title: (isAr ? data.meta_title_ar || data.meta_title : data.meta_title) || fallback.meta_title,
        meta_description: (isAr ? data.meta_description_ar || data.meta_description : data.meta_description) || fallback.meta_description,
        meta_keywords: (isAr ? data.meta_keywords_ar || data.meta_keywords : data.meta_keywords) || fallback.meta_keywords,
        other_meta: (isAr ? data.other_meta_ar || data.other_meta : data.other_meta) || fallback.other_meta,
      };

      return {
        data: {
          ...meta,
          product: initialVariant,
        },
        message: "Data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT data for ${slug}: ${error.message}`);
    }
  }

  static async getProductBaseData(slug) {
    const productBase = await models.ProductBase.findOne({
      attributes: ["id", "slug", "status"],
      where: {
        slug,
        status: true,
      },
    });

    if (!productBase) {
      return {
        data: null,
      };
    }

    return {
      data: productBase.toJSON(),
    };
  }
}

module.exports = MetaTagService;
