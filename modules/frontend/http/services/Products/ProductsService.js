const { Op, literal, where } = require("sequelize");
const { models, sequelize } = require("../../../../../database/models/index");
const { transformProductData, transformModelData, generateQueryParams, isItemWishListed } = require("../../traits/dataManipulations/product/product");
const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { setCache, getCache } = require("../../../../redis/redisService");
const ProductServiceHelpers = require("../../traits/products");

const { singleMediaWithoutType } = require("../../traits/mediaButtonHelper");

class ProductsService {
  static async getProductBySlug(params, type, userId) {
    const { slug, variantSku = null, model = null } = params;
    const isLoggedInUser = type === "user";

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
      const baseProduct = await ProductServiceHelpers?.getProductBaseData(slug);
      const { data: baseData, fromCache } = baseProduct;

      let initialVariant;

      if (variantSku) {
        const variantData = await models.ProductVariants.findOne({
          where: { sku: variantSku, status: true },
          attributes: [
            "id",
            "product_model_id",
            "sku",
            "title",
            "title_ar",
            "price",
            "stock",
            "media_path",
            "design_title_ar",
            "design_title",
            "hover_media_path",
          ],
          include: [
            {
              model: models.ProductCategory,
              as: "categories",
              attributes: ["id", "name", "name_ar", "slug"],
              through: { attributes: [] },
              required: false,
            },
            {
              association: "variant_images",
              attributes: ["id", "media_path", "media_type", "is_primary", "sort_order", "thumbnail_path"],
            },
            {
              association: "attribute_values",
              attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
              through: { attributes: [] },
              include: [
                {
                  association: "attribute",
                  attributes: ["id", "name", "name_ar", "code", "slug"],
                },
              ],
            },
            {
              association: "productModel",
              attributes: ["id", "code", "title", "base_price", "slug", "media_path", "title_ar"],
            },
          ],
        });

        const transformedData = transformProductData(variantData, true);
        initialVariant = transformedData?.data?.variantData;
      } else {
        if (model && !isModelAndFilters) {
          const productModelData = await models.ProductModels.findOne({
            where: { product_id: baseData?.id, slug: model, status: true },
            attributes: ["id", "code", "title", "slug", "media_path", "title_ar"],
            required: true,
            include: [
              {
                association: "variants",
                attributes: [
                  "id",
                  "product_model_id",
                  "sku",
                  "title",
                  "title_ar",
                  "price",
                  "stock",
                  "media_path",
                  "hover_media_path",
                  "design_title_ar",
                  "design_title",
                ],
                required: true,
                include: [
                  {
                    model: models.ProductCategory,
                    as: "categories",
                    attributes: ["id", "name", "name_ar", "slug"],
                    through: { attributes: [] },
                    required: false,
                  },
                  {
                    association: "variant_images",
                    attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"],
                  },
                  {
                    association: "attribute_values",
                    attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                    through: { attributes: [] },
                    include: [
                      {
                        association: "attribute",
                        attributes: ["id", "name", "name_ar", "code", "slug"],
                      },
                    ],
                  },
                ],
              },
            ],
          });
          const transformedData = transformModelData(productModelData);
          initialVariant = transformedData;
        } else {
          // When filters are present without model, query variants directly with attribute filters
          // First, resolve attribute slugs and value slugs to their IDs
          const attributeFilterConditions = [];

          for (const [attributeSlug, valueSlug] of filterEntries) {
            // Find the attribute value that matches both the attribute slug and value slug
            const attributeValue = await models.AttributeValues.findOne({
              where: { slug: valueSlug },
              attributes: ["id", "attribute_id"],
              include: [
                {
                  association: "attribute",
                  where: { slug: attributeSlug },
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

          // Build where clause for ProductVariants with strict attribute matching
          const whereClause = { status: true };

          if (attributeFilterConditions.length > 0) {
            whereClause[Op.and] = attributeFilterConditions.map((cond) => {
              return literal(`EXISTS (
                SELECT 1 FROM "product_variant_attributes" 
                WHERE "product_variant_attributes"."product_variant_id" = "ProductVariants"."id" 
                AND "product_variant_attributes"."attribute_id" = ${cond.attribute_id} 
                AND "product_variant_attributes"."attribute_value_id" = ${cond.attribute_value_id}
                AND "product_variant_attributes"."deletedAt" IS NULL
              )`);
            });
          }

          // Find variant matching all filters
          const variantData = await models.ProductVariants.findOne({
            where: whereClause,
            attributes: [
              "id",
              "product_model_id",
              "sku",
              "title",
              "title_ar",
              "price",
              "stock",
              "media_path",
              "hover_media_path",
              "design_title_ar",
              "design_title",
            ],
            include: [
              {
                model: models.ProductCategory,
                as: "categories",
                attributes: ["id", "name", "name_ar", "slug"],
                through: { attributes: [] },
                required: false,
              },
              {
                association: "variant_images",
                attributes: ["id", "media_path", "media_type", "is_primary", "sort_order", "thumbnail_path"],
              },
              {
                association: "attribute_values",
                attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                through: { attributes: [] },
                include: [
                  {
                    association: "attribute",
                    attributes: ["id", "name", "name_ar", "code", "slug"],
                  },
                ],
              },
              {
                association: "productModel",
                attributes: ["id", "code", "title", "base_price", "slug", "media_path"],
                where: isModelAndFilters ? { product_id: baseData?.id, slug: model } : undefined,
              },
            ],
          });

          if (variantData) {
            const transformedData = transformProductData(variantData, true);
            initialVariant = transformedData?.data?.variantData;
          } else {
            initialVariant = null;
          }
        }
      }

      const currentVariantId = initialVariant?.id;
      const currentModelId = initialVariant?.model_id;

      const data = await ProductServiceHelpers.getSimiliarProducts(currentModelId, currentVariantId, userId, isLoggedInUser);
      const similarVariants = data?.similarProducts || [];
      const isVariantWishListed = data?.isVariantWishListed || false;

      const boughtTogetherVariants = await ProductServiceHelpers.getBoughtTogetherProducts(currentVariantId, initialVariant);

      if (isLoggedInUser && isVariantWishListed) {
        initialVariant.isWishlisted = true;
      }

      return {
        data: {
          product: baseData,
          initialVariant,
          similarVariants,
          boughtTogetherVariants,
        },
        fromCache: false,
        message: "Data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT data for ${slug}: ${error.message}`);
    }
  }

  static async getProductListing(params, type, userId) {
    try {
      const {
        category,
        categories: categoriesParam,
        subCategories: subCategoriesParam,
        sectors: sectorsParam,
        priceMin,
        priceMax,
        attributes: attributesParam,
        sortBy,
        page = 1,
        limit = 12,
      } = params;

      const isLoggedInUser = type == "user";

      // Parse array parameters (handle both string and array inputs)
      const parseArrayParam = (param) => {
        if (!param) return [];
        if (Array.isArray(param)) return param.map(Number);
        if (typeof param === "string") {
          return param
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
        }
        return [];
      };

      // Parse attributes from query string format: attributes[11]='12,13' -> { 11: [12, 13] }
      const parseAttributesFromParams = (allParams) => {
        const result = {};
        Object.keys(allParams).forEach((key) => {
          const match = key.match(/^attributes\[(\d+)\]$/);
          if (match) {
            const attributeId = match[1];
            const valueIds = parseArrayParam(allParams[key]);
            if (valueIds.length > 0) {
              result[attributeId] = valueIds;
            }
          }
        });
        return result;
      };

      const categories = parseArrayParam(categoriesParam);
      const subCategories = parseArrayParam(subCategoriesParam);
      const sectors = parseArrayParam(sectorsParam);
      const attributes = parseAttributesFromParams(params);

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      // Build WHERE clause for ProductVariants
      const whereClause = {
        status: true,
      };

      // Price filter on variants
      if (priceMin || priceMax) {
        whereClause.price = {};
        if (priceMin) whereClause.price[Op.gte] = parseFloat(priceMin);
        if (priceMax) whereClause.price[Op.lte] = parseFloat(priceMax);
      }

      // Build category filter - combine categories and subCategories
      const allCategoryIds = [...categories, ...subCategories];
      let productBaseWhere = { status: true };

      // Build sector condition for many-to-many relationship
      let sectorCondition = null;
      if (sectors.length > 0) {
        sectorCondition = {
          id: {
            [Op.in]: sectors,
          },
          status: true,
        };
      }

      // Build attribute filter conditions

      let variantAttributeWhere = null;
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeConditions = [];
        Object.entries(attributes).forEach(([attributeId, valueIds]) => {
          if (valueIds && Array.isArray(valueIds) && valueIds.length > 0) {
            const valuesList = valueIds.map((id) => parseInt(id)).join(",");
            console.log("ATTRIBUTE VALUES", valuesList);
            attributeConditions.push(
              literal(`EXISTS (
                SELECT 1 FROM "product_variant_attributes" 
                WHERE "product_variant_attributes"."product_variant_id" = "ProductVariants"."id" 
                AND "product_variant_attributes"."attribute_id" = ${parseInt(attributeId)} 
                AND "product_variant_attributes"."attribute_value_id" IN (${valuesList})
                AND "product_variant_attributes"."deletedAt" IS NULL
              )`),
            );
          }
        });

        if (attributeConditions.length > 0) {
          whereClause[Op.and] = attributeConditions;
        }
      }

      // Build ORDER BY clause
      let orderClause = [["createdAt", "DESC"]]; // default
      switch (sortBy) {
        case "price-low-high":
          orderClause = [["price", "ASC"]];
          break;
        case "price-high-low":
          orderClause = [["price", "DESC"]];
          break;
        case "name-a-z":
          orderClause = [["title", "ASC"]];
          break;
        case "name-z-a":
          orderClause = [["title", "DESC"]];
          break;
        default:
          orderClause = [["createdAt", "DESC"]];
      }

      // Check if we need to filter by category or sector
      const needsCategoryFilter = category || allCategoryIds.length > 0;
      const needsSectorFilter = sectors.length > 0;

      // Build variant-level category EXISTS filter
      if (needsCategoryFilter) {
        const catIds = allCategoryIds.length > 0 ? allCategoryIds : [parseInt(category)];
        const safeCatIds = catIds.filter((id) => Number.isInteger(id) && id > 0);
        if (safeCatIds.length > 0) {
          whereClause[Op.and] = [
            ...(whereClause[Op.and] || []),
            literal(`EXISTS (
              SELECT 1 FROM "product_variant_categories" pvc_f
              WHERE pvc_f."product_variant_id" = "ProductVariants"."id"
                AND pvc_f."category_id" IN (${safeCatIds.join(",")})
            )`),
          ];
        }
      }

      console.log("ORDER CLAUSE", orderClause);
      console.log("ALL CATEGORY", needsCategoryFilter);
      console.log("ALL SECTOR", needsSectorFilter);

      // Build include array
      const includeArray = [
        {
          model: models.ProductVariantAttributes,
          as: "variant_attributes",
          attributes: ["id", "attribute_id", "attribute_value_id"],
          ...(variantAttributeWhere ? { where: variantAttributeWhere, required: true } : {}),
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
          attributes: ["id", "name", "name_ar", "slug"],
          through: { attributes: [] },
          required: false,
        },
        {
          attributes: ["id", "slug"],
          model: models.ProductModels,
          as: "productModel",
          required: needsSectorFilter,
          include: [
            {
              attributes: ["id", "slug"],
              model: models.ProductBase,
              as: "product",
              where: productBaseWhere,
              required: needsSectorFilter,
              include: [
                ...(needsSectorFilter
                  ? [
                      {
                        association: "sectors",
                        attributes: ["id", "name", "name_ar", "slug", "status"],
                        through: { attributes: [] },
                        where: sectorCondition,
                        required: true,
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
      ];

      const { rows: products, count: totalCount } = await models.ProductVariants.findAndCountAll({
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "product_code", "sku", "product_model_id"],
        where: whereClause,
        limit: limitNum,
        offset,
        order: orderClause,
        include: includeArray,
        distinct: true,
        subQuery: false,
      });

      // Get all unique product_model_ids from fetched products
      const productModelIds = [...new Set(products.map((p) => p.product_model_id).filter(Boolean))];

      // Get variant counts per model to determine hasMoreVariants
      let variantCountsMap = {};
      if (productModelIds.length > 0) {
        const variantCounts = await models.ProductVariants.findAll({
          attributes: ["product_model_id", [literal("COUNT(id)"), "variant_count"]],
          where: {
            product_model_id: { [Op.in]: productModelIds },
            status: true,
          },
          group: ["product_model_id"],
          raw: true,
        });
        variantCountsMap = variantCounts.reduce((acc, item) => {
          acc[item.product_model_id] = parseInt(item.variant_count, 10);
          return acc;
        }, {});
      }

      let wishlistedItems = [];

      if (isLoggedInUser) {
        wishlistedItems = await models.Wishlist.findAll({
          where: {
            user_id: userId,
          },
          attributes: ["product_variant_id"],
          raw: true,
        });
      }

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        const modelVariantCount = variantCountsMap[json?.product_model_id] || 0;

        // Format attributes for query params generation
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
          variants_available: json?.has_more_items,
          hasMoreVariants: modelVariantCount > 1,
          wishlisted: isItemWishListed(json?.id, wishlistedItems),
          price: json?.price,
          stock: json?.stock,
          categories: (json?.categories || []).map((c) => ({ id: c.id, name: c.name, name_ar: c.name_ar, slug: c.slug })),
          variant_attributes: json?.variant_attributes,
          query_params: generateQueryParams(variantSku, modelSlug, formattedAttributes),
        };
      });

      return {
        data: {
          products: transformedData,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
            hasPrevPage: pageNum > 1,
          },
        },
        fromCache: false,
        message: "Data fetched successfully",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT listing:`, error);
      throw new Error(`Error fetching PRODUCT listing: ${error.message}`);
    }
  }

  static async getProductModelData(params) {
    const { slug, attributes: allAttributes } = params;

    const parseAttributesFromParams = (allParams) => {
      const result = {};
      Object.keys(allParams).forEach((key) => {
        const match = key.match(/^attributes\[(\d+)\]$/);
        if (match) {
          const attributeId = match[1];
          const valueIds = parseArrayParam(allParams[key]);
          if (valueIds.length > 0) {
            result[attributeId] = valueIds;
          }
        }
      });
      return result;
    };

    const attributes = parseAttributesFromParams(params);

    const whereClauseForModel = { status: true };
    if (attributes && Object.keys(attributes).length > 0) {
      const attributeConditions = [];
      Object.entries(attributes).forEach(([attributeId, valueIds]) => {
        if (valueIds && Array.isArray(valueIds) && valueIds.length > 0) {
          const valuesList = valueIds.map((id) => parseInt(id)).join(",");
          attributeConditions.push(
            literal(`EXISTS (
              SELECT 1 FROM "product_variant_attributes" 
              WHERE "product_variant_attributes"."product_variant_id" = "variants"."id" 
              AND "product_variant_attributes"."attribute_id" = ${parseInt(attributeId)} 
              AND "product_variant_attributes"."attribute_value_id" IN (${valuesList})
              AND "product_variant_attributes"."deletedAt" IS NULL
            )`),
          );
        }
      });
      if (attributeConditions.length > 0) {
        whereClauseForModel[Op.and] = attributeConditions;
      }
    }

    try {
      const productModelData = await models.ProductModels.findOne({
        where: { slug, status: true },
        attributes: ["id", "code", "title", "slug", "media_path"],
        required: true,
        include: [
          {
            association: "variants",
            attributes: ["id", "sku", "title", "title_ar", "price", "stock", "media_path"],
            required: true,
            where: whereClauseForModel,
            include: [
              {
                association: "variant_images",
                attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"],
              },
              {
                association: "attribute_values",
                attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                through: { attributes: [] },
                include: [
                  {
                    association: "attribute",
                    attributes: ["id", "name", "name_ar", "code", "slug"],
                  },
                ],
              },
            ],
          },
        ],
      });

      const transformedData = transformModelData(productModelData);

      return {
        data: transformedData || [],
        fromCache: false,
        message: "About page data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT MODEL data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT MODEL data for ${slug}: ${error.message}`);
    }
  }

  static async getInitialProductList(params, type, userId) {
    try {
      const {
        category,
        categories: categoriesParam,
        subCategories: subCategoriesParam,
        sectors: sectorsParam,
        priceMin,
        priceMax,
        sortBy,
        page = 1,
        limit = 12,
      } = params;

      const isLoggedInUser = type === "user";

      const parseArrayParam = (param) => {
        if (!param) return [];
        if (Array.isArray(param)) return param.map(Number);
        if (typeof param === "string")
          return param
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
        return [];
      };

      const parsePriceRanges = (param) => {
        if (!param) return [];
        return param.split(",").map((range) => {
          const [min, max] = range.split("-").map(Number);
          return { min, max };
        });
      };

      const priceRanges = parsePriceRanges(params.priceRanges);

      const parseAttributesFromParams = (allParams) => {
        const result = {};
        Object.keys(allParams).forEach((key) => {
          const match = key.match(/^attributes\[(\d+)\]$/);
          if (match) {
            const attributeId = match[1];
            const valueIds = parseArrayParam(allParams[key]);
            if (valueIds.length > 0) result[attributeId] = valueIds;
          }
        });
        return result;
      };

      const categories = parseArrayParam(categoriesParam);
      const subCategories = parseArrayParam(subCategoriesParam);
      const sectors = parseArrayParam(sectorsParam);
      const attributes = parseAttributesFromParams(params);

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      // ─── Dynamic WHERE fragments + replacements ──────────────────────────────
      const conditions = []; // SQL fragments for WHERE
      const replacements = {}; // named replacements for sequelize.query

      // Variant status
      conditions.push(`pv."deletedAt" IS NULL`);
      conditions.push(`pv."status" = true`);

      // Price
      if (priceMin) {
        conditions.push(`pv."price" >= :priceMin`);
        replacements.priceMin = parseFloat(priceMin);
      }
      if (priceMax) {
        conditions.push(`pv."price" <= :priceMax`);
        replacements.priceMax = parseFloat(priceMax);
      }

      if (priceRanges.length > 0) {
        const rangeSQL = priceRanges
          .map((r, i) => {
            replacements[`priceRangeMin_${i}`] = r.min;
            replacements[`priceRangeMax_${i}`] = r.max;
            return `(pv."price" >= :priceRangeMin_${i} AND pv."price" <= :priceRangeMax_${i})`;
          })
          .join(" OR ");

        conditions.push(`(${rangeSQL})`);
      }

      // Product base status
      conditions.push(`pb."status" = true`);

      // Category / SubCategory filter (now on variant level via product_variant_categories)
      const allCategoryIds = [...categories, ...subCategories];
      if (allCategoryIds.length > 0) {
        replacements.allCategoryIds = allCategoryIds;
        conditions.push(`EXISTS (
          SELECT 1 FROM "product_variant_categories" pvc_f
          WHERE pvc_f."product_variant_id" = pv."id"
            AND pvc_f."category_id" IN (:allCategoryIds)
        )`);
      } else if (category) {
        replacements.categoryId = parseInt(category);
        conditions.push(`EXISTS (
          SELECT 1 FROM "product_variant_categories" pvc_f
          WHERE pvc_f."product_variant_id" = pv."id"
            AND pvc_f."category_id" = :categoryId
        )`);
      }

      // Sector filter — semi-join via EXISTS
      if (sectors.length > 0) {
        replacements.sectorIds = sectors;
        conditions.push(`
        EXISTS (
          SELECT 1 FROM "product_base_sectors" pbs   -- adjust junction table name
          WHERE pbs."product_base_id" = pb."id"
            AND pbs."sector_id" IN (:sectorIds)
        )
      `);
      }

      // Attribute filter — one EXISTS per attribute group (AND between groups)
      if (Object.keys(attributes).length > 0) {
        Object.entries(attributes).forEach(([attributeId, valueIds]) => {
          if (Array.isArray(valueIds) && valueIds.length > 0) {
            const key = `attrValues_${attributeId}`;
            replacements[key] = valueIds.map(Number);
            conditions.push(`
            EXISTS (
              SELECT 1 FROM "product_variant_attributes" pva
              WHERE pva."product_variant_id" = pv."id"
                AND pva."attribute_id"       = ${parseInt(attributeId)}
                AND pva."attribute_value_id" IN (:${key})
                AND pva."deletedAt"          IS NULL
            )
          `);
          }
        });
      }

      const whereSQL = conditions.length ? `WHERE ${conditions.join("\n  AND ")}` : "";

      // ─── ORDER BY ────────────────────────────────────────────────────────────
      const orderMap = {
        "price-low-high": `pv."price" ASC`,
        "price-high-low": `pv."price" DESC`,
        "name-a-z": `pv."title" ASC`,
        "name-z-a": `pv."title" DESC`,
      };
      const orderSQL = orderMap[sortBy] || `pv."createdAt" DESC`;

      // ─── MAIN QUERY ──────────────────────────────────────────────────────────
      const mainSQL = `
      SELECT
        pv."id",
        pv."title",
        pv."title_ar",
        pv."media_path",
        pv."hover_media_path",
        pv."price",
        pv."stock",
        pv."product_code",
        pv."sku",
        pv."product_model_id",

        pm."slug"                         AS "model_slug",

        pb."slug"                         AS "base_slug",

        -- Aggregate categories as JSON array
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id',      pc."id",
              'name',    pc."name",
              'name_ar', pc."name_ar",
              'slug',    pc."slug"
            )
          ) FILTER (WHERE pc."id" IS NOT NULL),
          '[]'
        )                                 AS "categories",

        -- Aggregate variant attributes as JSON array
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id',                pva."id",
              'attribute_id',      pva."attribute_id",
              'attribute_value_id',pva."attribute_value_id",
              'attribute_name',    pa."name",
              'attribute_name_ar', pa."name_ar",
              'attribute_code',    pa."code",
              'attribute_slug',    pa."slug",
              'value',             av."value",
              'value_ar',          av."value_ar",
              'value_slug',        av."slug"
            )
          ) FILTER (WHERE pva."id" IS NOT NULL),
          '[]'
        )                                 AS "variant_attributes",

        COUNT(*) OVER()                   AS "total_count"   -- window for pagination total

      FROM "product_variants" pv

      -- Model
      INNER JOIN "product_models" pm
        ON pm."id" = pv."product_model_id"
        AND pm."deletedAt" IS NULL AND pm."status" = true

      -- Product base
      INNER JOIN "product_base" pb
        ON pb."id" = pm."product_id"        -- adjust FK name if different
        AND pb."deletedAt" IS NULL

      -- Categories via junction table (left join so category-less variants still show)
      LEFT JOIN "product_variant_categories" pvc_cat
        ON pvc_cat."product_variant_id" = pv."id"
      LEFT JOIN "product_categories" pc
        ON pc."id" = pvc_cat."category_id"
        AND pc."deletedAt" IS NULL

      -- Variant attributes (left join — variants without attributes still show)
      LEFT JOIN "product_variant_attributes" pva
        ON pva."product_variant_id" = pv."id"
        AND pva."deletedAt" IS NULL

      LEFT JOIN "product_attributes" pa
        ON pa."id" = pva."attribute_id"

      LEFT JOIN "attribute_values" av
        ON av."id" = pva."attribute_value_id"

      ${whereSQL}

      GROUP BY
        pv."id",
        pv."title",
        pv."title_ar",
        pv."media_path",
        pv."hover_media_path",
        pv."price",
        pv."stock",
        pv."product_code",
        pv."sku",
        pv."product_model_id",
        pm."slug",
        pb."slug"

      ORDER BY ${orderSQL}

      LIMIT  :limitNum
      OFFSET :offsetNum
    `;

      replacements.limitNum = limitNum;
      replacements.offsetNum = offset;

      let debugQuery = mainSQL;
      Object.entries(replacements).forEach(([key, value]) => {
        const val = Array.isArray(value) ? `(${value.join(",")})` : `'${value}'`;
        debugQuery = debugQuery.replace(new RegExp(`:${key}\\b`, "g"), val);
      });
      console.log("FINAL QUERY:\n", debugQuery);

      const rawResults = await sequelize.query(mainSQL, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      const totalCount = rawResults.length > 0 ? parseInt(rawResults[0].total_count, 10) : 0;

      // ─── Variant counts (kept as separate query — unchanged logic) ───────────
      const productModelIds = [...new Set(rawResults.map((r) => r.product_model_id).filter(Boolean))];
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

      // ─── Wishlist (kept as separate query — unchanged logic) ─────────────────
      let wishlistedItems = [];
      if (isLoggedInUser) {
        wishlistedItems = await models.Wishlist.findAll({
          where: { user_id: userId },
          attributes: ["product_variant_id"],
          raw: true,
        });
      }

      // ─── Transform ───────────────────────────────────────────────────────────
      const transformedData = rawResults.map((row) => {
        const variantAttrs = Array.isArray(row.variant_attributes) ? row.variant_attributes : JSON.parse(row.variant_attributes || "[]");

        const modelVariantCount = variantCountsMap[row.product_model_id] || 0;

        const formattedAttributes = variantAttrs.map((va) => ({
          code: va.attribute_code,
          slug: va.attribute_slug,
          values: [{ slug: va.value_slug, value: va.value }],
        }));

        return {
          id: row.id,
          title: row.title,
          title_ar: row.title_ar,
          media_path: generateImageUrl(row.media_path),
          hover_media_path: generateImageUrl(row.hover_media_path),
          slug: row.sku,
          base_slug: row.base_slug,
          model_slug: row.model_slug,
          product_code: row.product_code,
          hasMoreVariants: modelVariantCount > 1,
          isWishlisted: isItemWishListed(row.id, wishlistedItems),
          price: row.price,
          stock: row.stock,
          categories: Array.isArray(row.categories) ? row.categories : JSON.parse(row.categories || "[]"),
          variant_attributes: variantAttrs,
          query_params: generateQueryParams(row.sku, row.model_slug, formattedAttributes),
        };
      });

      console.log(transformedData.length);

      return {
        data: {
          products: transformedData,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
            hasPrevPage: pageNum > 1,
          },
        },
        fromCache: false,
        message: "Data fetched successfully",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT listing:`, error);
      throw new Error(`Error fetching PRODUCT listing: ${error.message}`);
    }
  }

  static async productSearchList(params) {
    try {
      const { category, page = 1, limit = 12 } = params;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      // Build category filter - if category is provided, get it and all its subcategories
      let categoryIds = [];
      if (category) {
        const categoryId = parseInt(category);

        // Get the category to check if it's a parent
        const categoryData = await models.ProductCategory.findOne({
          where: { id: categoryId, status: true },
          attributes: ["id", "parent_id"],
        });

        if (categoryData) {
          categoryIds.push(categoryId);

          // If this is a parent category (parent_id is null), get all child categories
          if (!categoryData.parent_id) {
            const childCategories = await models.ProductCategory.findAll({
              where: { parent_id: categoryId, status: true },
              attributes: ["id"],
            });
            categoryIds = [...categoryIds, ...childCategories.map((c) => c.id)];
          }
        }
      }

      // Build WHERE clause for variants
      const variantWhere = { status: true };

      // Apply variant-level category filter via EXISTS subquery
      if (categoryIds.length > 0) {
        const safeCatIds = categoryIds.filter((id) => Number.isInteger(id) && id > 0);
        variantWhere[Op.and] = [
          literal(`EXISTS (
            SELECT 1 FROM "product_variant_categories" pvc_f
            WHERE pvc_f."product_variant_id" = "ProductVariants"."id"
              AND pvc_f."category_id" IN (${safeCatIds.join(",")})
          )`),
        ];
      }

      // First approach: Search in variants and their related products
      const { rows: products, count: totalCount } = await models.ProductVariants.findAndCountAll({
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "product_code", "sku"],
        where: variantWhere,
        limit: limitNum,
        offset,
        include: [
          {
            model: models.ProductCategory,
            as: "categories",
            attributes: ["id", "name", "name_ar", "slug", "parent_id"],
            through: { attributes: [] },
            required: false,
          },
          {
            model: models.ProductModels,
            as: "productModel",
            attributes: ["id", "slug", "title", "title_ar"],
            required: true,
            where: { status: true },
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "title_ar", "slug"],
                required: true,
                where: { status: true },
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
                attributes: ["id", "value", "value_ar", "slug", "media_path"],
              },
            ],
          },
        ],
        distinct: true,
        subQuery: false,
        order: [["createdAt", "DESC"]],
      });

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        return {
          id: json?.id,
          title: json?.title,
          title_ar: json?.title_ar,
          media_path: generateImageUrl(json?.media_path),
          slug: json?.sku,
          base_slug: json?.productModel?.product?.slug,
          model_slug: json?.productModel?.slug,
          product_code: json?.product_code,
          price: json?.price,
          stock: json?.stock,
          categories: (json?.categories || []).map((c) => ({
            id: c?.id,
            name: c?.name,
            name_ar: c?.name_ar,
            slug: c?.slug,
            parent_id: c?.parent_id,
          })),
          product: {
            id: json?.productModel?.product?.id,
            title: json?.productModel?.product?.title,
            title_ar: json?.productModel?.product?.title_ar,
          },
          model: {
            id: json?.productModel?.id,
            title: json?.productModel?.title,
            title_ar: json?.productModel?.title_ar,
          },
          attributes: json?.variant_attributes?.map((attr) => ({
            id: attr?.attribute?.id,
            name: attr?.attribute?.name,
            name_ar: attr?.attribute?.name_ar,
            code: attr?.attribute?.code,
            value: {
              id: attr?.attributeValue?.id,
              value: attr?.attributeValue?.value,
              value_ar: attr?.attributeValue?.value_ar,
              slug: attr?.attributeValue?.slug,
              media_path: generateImageUrl(attr?.attributeValue?.media_path),
            },
          })),
        };
      });

      return {
        data: {
          products: transformedData,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
            hasPrevPage: pageNum > 1,
          },
        },
        fromCache: false,
        message: "Search results fetched successfully",
      };
    } catch (error) {
      console.error(`Error in product search:`, error);
      throw new Error(`Error in product search: ${error.message}`);
    }
  }

  static async productSearchListByKeywords(req, res, params) {
    try {
      const { keywords } = params;

      let whereClause = {
        status: true,
      };
      if (keywords?.trim()) {
        whereClause.title = {
          [Op.iLike]: `%${keywords.trim()}%`,
        };
      }

      const products = await models.ProductVariants.findAll({
        where: whereClause,
        include: [
          {
            model: models.ProductCategory,
            as: "categories",
            attributes: ["id", "name", "name_ar", "slug", "parent_id"],
            through: { attributes: [] },
            required: false,
          },
          {
            model: models.ProductModels,
            as: "productModel",
            attributes: ["id", "slug", "title", "title_ar"],
            required: true,
            where: { status: true },
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "slug"],
                required: true,
                where: { status: true },
              },
            ],
          },
        ],
        distinct: true,
        subQuery: false,
        order: [["createdAt", "DESC"]],
      });

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        return {
          id: json?.id,
          title: json?.title,
          title_ar: json?.title_ar,
          media: json?.media_path && singleMediaWithoutType(json, "media_path", "title", "title_ar"),
          hoverMedia: json?.hover_media_path && singleMediaWithoutType(json, "hover_media_path", "title", "title_ar"),
          slug: json?.sku,
          stock: json?.stock,
          baseSlug: json?.productModel?.product?.slug,
          categories: (json?.categories || []).map((c) => ({
            id: c?.id,
            name: c?.name,
            name_ar: c?.name_ar,
            slug: c?.slug,
            parent_id: c?.parent_id,
          })),
        };
      });

      return {
        data: transformedData,
      };
    } catch (error) {
      console.error(`Error in product search by keywords:`, error);
      throw new Error(`Error in product search by keywords: ${error.message}`);
    }
  }
}

module.exports = ProductsService;
