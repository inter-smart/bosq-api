const { Op, literal } = require("sequelize");
const { models } = require("../../../../../database/models/index");
const { transformProductData, transformModelData, generateQueryParams, isItemWishListed } = require("../../traits/dataManipulations/product/product");
const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { setCache, getCache } = require("../../../../redis/redisService");
const ProductServiceHelpers = require("../../traits/products");

const { singleMediaWithoutType } = require("../../traits/mediaButtonHelper");

class ProductsService {
  static async getProductBySlug(params) {
    const { slug, variantSku = null, model = null } = params;

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

      const relatedModels = await ProductServiceHelpers?.getProductVariantRelatedModels(baseData?.id);

      const { data: modelsData, fromCache: modelsFromCache } = relatedModels;

      let initialVariant;

      if (variantSku) {
        const variantData = await models.ProductVariants.findOne({
          where: { sku: variantSku, status: true },
          attributes: ["id", "product_model_id", "sku", "title", "title_ar", "price", "stock", "media_path"],
          include: [
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
            },
          ],
        });

        const transformedData = transformProductData(variantData, true);
        initialVariant = transformedData?.data?.variantData;
      } else {
        if (model && !isModelAndFilters) {
          const productModelData = await models.ProductModels.findOne({
            where: { product_id: baseData.id, slug: model, status: true },
            attributes: ["id", "code", "title", "slug", "media_path"],
            required: true,
            include: [
              {
                association: "variants",
                attributes: ["id", "product_model_id", "sku", "title", "title_ar", "price", "stock", "media_path"],
                required: true,
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
          const whereClause = { product_id: baseData.id, status: true };

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
            attributes: ["id", "product_model_id", "sku", "title", "title_ar", "price", "stock", "media_path"],
            include: [
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
                where: isModelAndFilters ? { slug: model } : undefined,
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

      const similarVariants = currentModelId ? await ProductServiceHelpers.getSimiliarProducts(currentModelId, currentVariantId) : [];

      return {
        data: {
          product: baseData,
          initialVariant,
          models: modelsData,
          similarVariants,
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

      // Single category filter (from URL/params)
      if (category && allCategoryIds.length === 0) {
        productBaseWhere.category_id = parseInt(category);
      }

      // Multiple categories/subcategories filter (from filter UI)
      if (allCategoryIds.length > 0) {
        productBaseWhere.category_id = {
          [Op.in]: allCategoryIds,
        };
      }

      // Build sector condition for many-to-many relationship
      let sectorCondition = null;
      if (sectors.length > 0) {
        sectorCondition = {
          id: {
            [Op.in]: sectors,
          },
        };
      }

      // Build attribute filter conditions

      let variantAttributeWhere = null;
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeConditions = [];
        Object.entries(attributes).forEach(([attributeId, valueIds]) => {
          if (valueIds && Array.isArray(valueIds) && valueIds.length > 0) {
            const valuesList = valueIds.map((id) => parseInt(id)).join(",");
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
          attributes: ["id", "slug"],
          model: models.ProductModels,
          as: "productModel",
          required: needsCategoryFilter || needsSectorFilter,
          include: [
            {
              attributes: ["id", "category_id", "slug"],
              model: models.ProductBase,
              as: "product",
              where: productBaseWhere,
              required: needsCategoryFilter || needsSectorFilter,
              include: [
                {
                  attributes: ["id", "name_ar", "name"],
                  model: models.ProductCategory,
                  as: "category",
                },
                ...(needsSectorFilter
                  ? [
                      {
                        association: "sectors",
                        attributes: ["id", "name", "name_ar", "slug"],
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

      console.log("WISHLIST", wishlistedItems);

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
          category_name: json?.productModel?.product?.category?.name || null,
          category_ar: json?.productModel?.product?.category?.name_ar || null,
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

  static async getInitialProductList(page = 1, limit = 12) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      const { rows: products, count: totalCount } = await models.ProductVariants.findAndCountAll({
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "sku", "product_model_id"],
        where: { status: true },
        limit: limitNum,
        offset,
        include: [
          {
            attributes: ["id", "slug"],
            model: models.ProductModels,
            as: "productModel",
            include: [
              {
                attributes: ["id", "category_id", "slug"],
                model: models.ProductBase,
                as: "product",
                include: [
                  {
                    attributes: ["id", "name_ar", "name"],
                    model: models.ProductCategory,
                    as: "category",
                  },
                ],
              },
            ],
          },
        ],
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
      const transformedData = products.map((item) => {
        const json = item.toJSON();
        const modelVariantCount = variantCountsMap[json?.product_model_id] || 0;

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
        const variantSlug = json?.sku;

        return {
          id: json?.id,
          title: json?.title,
          title_ar: json?.title_ar,
          media_path: generateImageUrl(json?.media_path),
          slug: json?.sku,
          base_slug: baseSlug,
          model_slug: json?.productModel?.slug,
          product_code: json?.product_code,
          hasMoreVariants: modelVariantCount > 1,
          variants_available: json?.has_more_items,
          price: json?.price,
          stock: json?.stock,
          category_name: json?.productModel?.product?.category?.name || null,
          category_ar: json?.productModel?.product?.category?.name_ar || null,
          variant_attributes: json?.variant_attributes,
          query_params: generateQueryParams(variantSlug, modelSlug, formattedAttributes),
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

      // Build product base where clause
      const productBaseWhere = { status: true };
      if (categoryIds.length > 0) {
        productBaseWhere.category_id = { [Op.in]: categoryIds };
      }

      // First approach: Search in variants and their related products
      const { rows: products, count: totalCount } = await models.ProductVariants.findAndCountAll({
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "product_code", "sku"],
        where: {
          ...variantWhere,
        },
        limit: limitNum,
        offset,
        include: [
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
                attributes: ["id", "title", "title_ar", "slug", "category_id"],
                required: true,
                where: categoryIds.length > 0 ? productBaseWhere : { status: true },
                include: [
                  {
                    model: models.ProductCategory,
                    as: "category",
                    attributes: ["id", "name", "name_ar", "slug", "parent_id"],
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
          category: {
            id: json?.productModel?.product?.category?.id,
            name: json?.productModel?.product?.category?.name,
            name_ar: json?.productModel?.product?.category?.name_ar,
            slug: json?.productModel?.product?.category?.slug,
            parent_id: json?.productModel?.product?.category?.parent_id,
          },
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
                include: [
                  {
                    model: models.ProductCategory,
                    as: "category",
                    attributes: ["id", "name", "name_ar", "slug", "parent_id"],
                  },
                ],
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
          media: singleMediaWithoutType(json, "media_path", "title", "title_ar"),
          hoverMedia: singleMediaWithoutType(json, "hover_media_path", "title", "title_ar"),
          slug: json?.sku,
          stock: json?.stock,
          baseSlug: json?.productModel?.product?.slug,
          category: {
            id: json?.productModel?.product?.category?.id,
            name: json?.productModel?.product?.category?.name,
            name_ar: json?.productModel?.product?.category?.name_ar,
            slug: json?.productModel?.product?.category?.slug,
            parent_id: json?.productModel?.product?.category?.parent_id,
          },
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
