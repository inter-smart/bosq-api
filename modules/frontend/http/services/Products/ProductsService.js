const { Op, literal } = require("sequelize");
const { models } = require("../../../../../database/models/index");
const { transformProductData, transformModelData } = require("../../traits/dataManipulations/product/product");
const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const productAttributes = [
  "id",
  "title",
  "title_ar",
  "slug",
  "description",
  "description_ar",
  "details",
  "details_ar",
  "details_points",
  "details_points_ar",
  "additional_details",
  "additional_details_ar",
  "media_path",
  "category_id",
  "sort_order",
  "status",
];

class ProductsService {
  static async getProductBySlug(slug) {
    try {
      const productBase = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: ["id"],
      });

      if (!productBase) {
        return {
          data: [],
          fromCache: false,
          message: "Product not found",
        };
      }

      const productData = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: productAttributes,
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug", "media_path"], through: { attributes: [] } },
          { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
          {
            association: "models",
            attributes: ["id", "code", "title", "base_price", "slug", "media_path"],
            required: true,
            include: [
              {
                association: "variants",
                attributes: ["id", "sku"],
                required: true,
                include: [
                  { association: "variant_images", attributes: ["id", "media_path", "media_type", "is_primary", "sort_order", "thumbnail_path"] },
                  {
                    association: "attribute_values",
                    attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                    through: { attributes: [] },
                    include: [{ association: "attribute", attributes: ["id", "name", "name_ar", "code", "slug"] }],
                  },
                ],
              },
            ],
          },
          { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
          { association: "faqs", attributes: ["id", "question", "answer", "question_ar", "answer_ar"] },
        ],
        order: [
          [
            {
              model: models.ProductModels,
              as: "models",
            },
            "sort_order",
            "ASC",
          ],
        ],
      });

      const productmodels = await models?.ProductModels?.findAll({
        where: { product_id: productBase.id, status: true },
        attributes: ["id", "code", "title", "title_ar", "slug", "media_path"],
      });

      const transformedData = transformProductData(productData);

      return {
        data: {
          product: transformedData?.data?.productBaseData,
          initialModel: transformedData?.data?.modelWiseData,
          models: productmodels?.map((model) => ({
            id: model.id,
            code: model.code,
            title: model.title,
            title_ar: model.title_ar,
            slug: model.slug,
            media_path: generateImageUrl(model.media_path),
          })),
        },
        fromCache: false,
        message: "Data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT data for ${slug}: ${error.message}`);
    }
  }

  static async getProductListing(params) {
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

      console.log(params);

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

      console.log(attributes && Object.keys(attributes).length > 0);

      let variantAttributeWhere = null;
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeConditions = [];
        console.log(attributes);
        Object.entries(attributes).forEach(([attributeId, valueIds]) => {
          if (valueIds && Array.isArray(valueIds) && valueIds.length > 0) {
            attributeConditions.push({
              attribute_id: parseInt(attributeId),
              attribute_value_id: {
                [Op.in]: valueIds.map((id) => parseInt(id)),
              },
            });
          }
        });
        if (attributeConditions.length > 0) {
          variantAttributeWhere = {
            [Op.or]: attributeConditions,
          };
        }
      }

      console.log(variantAttributeWhere);

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
          ...(variantAttributeWhere ? { where: variantAttributeWhere, required: true } : {}),
        },
        {
          attributes: ["id"],
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

      console.log(whereClause);

      const { rows: products, count: totalCount } = await models.ProductVariants.findAndCountAll({
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock", "product_code"],
        where: whereClause,
        limit: limitNum,
        offset,
        order: orderClause,
        include: includeArray,
        distinct: true,
        subQuery: false,
      });

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        return {
          id: json?.id,
          title: json?.title,
          title_ar: json?.title_ar,
          media_path: generateImageUrl(json?.media_path),
          slug: json?.productModel?.product?.slug,
          product_code: json?.product_code,
          variants_available: json?.has_more_items,
          price: json?.price,
          stock: json?.stock,
          category_name: json?.productModel?.product?.category?.name || null,
          category_ar: json?.productModel?.product?.category?.name_ar || null,
          variant_attributes: json?.variant_attributes,
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
  static async getProductModelData(slug) {
    try {
      const productModelData = await models.ProductModels.findOne({
        where: { slug, status: true },
        attributes: ["id", "code", "title", "slug", "media_path"],
        required: true,
        include: [
          {
            association: "variants",
            attributes: ["id", "sku"],
            required: true,
            include: [
              { association: "variant_images", attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"] },
              {
                association: "attribute_values",
                attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                through: { attributes: [] },
                include: [{ association: "attribute", attributes: ["id", "name", "name_ar", "code", "slug"] }],
              },
            ],
          },
        ],
      });

      const transformedData = transformModelData(productModelData);

      return {
        data: transformedData,
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
        attributes: ["id", "title", "title_ar", "media_path", "price", "stock"],
        where: { status: true },
        limit: limitNum,
        offset,
        include: [
          {
            attributes: ["id"],
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

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        return {
          id: json?.id,
          title: json?.title,
          title_ar: json?.title_ar,
          media_path: generateImageUrl(json?.media_path),
          slug: json?.productModel?.product?.slug,
          product_code: json?.product_code,
          variants_available: json?.has_more_items,
          price: json?.price,
          stock: json?.stock,
          category_name: json?.productModel?.product?.category?.name || null,
          category_ar: json?.productModel?.product?.category?.name_ar || null,
          variant_attributes: json?.variant_attributes,
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
}

module.exports = ProductsService;
