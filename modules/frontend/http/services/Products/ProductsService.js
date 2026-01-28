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
        // priceMin,
        // priceMax,
        attributes: attributesParam,
        sortBy,
        page = 1,
        limit = 12,
      } = params;

      console.log("params:", params);

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

      // Parse attributes parameter (handle both string and object inputs)
      const parseAttributesParam = (param) => {
        if (!param) return {};
        if (typeof param === "object") return param;
        if (typeof param === "string") {
          try {
            return JSON.parse(param);
          } catch (e) {
            console.error("Error parsing attributes:", e);
            return {};
          }
        }
        return {};
      };

      const categories = parseArrayParam(categoriesParam);
      const subCategories = parseArrayParam(subCategoriesParam);
      const sectors = parseArrayParam(sectorsParam);
      const attributes = parseAttributesParam(attributesParam);

      // Build WHERE clause
      const whereClause = {
        status: true,
      };

      // Build category filter - combine categories and subCategories
      const allCategoryIds = [...categories, ...subCategories];

      // Single category filter (from URL/params)
      if (category && allCategoryIds.length === 0) {
        whereClause.category_id = parseInt(category);
      }

      // Multiple categories/subcategories filter (from filter UI)
      if (allCategoryIds.length > 0) {
        whereClause.category_id = {
          [Op.in]: allCategoryIds,
        };
      }

      // Single sector filter (from URL/params)
      // Note: Commented out because sectors is many-to-many
      // if (sector) {
      //   whereClause.sector_id = parseInt(sector);
      // }

      // Build sector condition for many-to-many relationship
      let sectorCondition = null;
      if (sectors.length > 0) {
        sectorCondition = {
          id: {
            [Op.in]: sectors,
          },
        };
      }

      // Build ORDER BY clause
      let orderClause = [["createdAt", "DESC"]]; // default
      switch (sortBy) {
        case "price-low-high":
          // This requires a subquery or join with models table
          orderClause = [[literal("(SELECT MIN(price) FROM product_models WHERE product_models.product_base_id = ProductBase.id)"), "ASC"]];
          break;
        case "price-high-low":
          orderClause = [[literal("(SELECT MAX(price) FROM product_models WHERE product_models.product_base_id = ProductBase.id)"), "DESC"]];
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

      // Build include array
      const includeArray = [
        {
          association: "category",
          attributes: ["id", "name", "name_ar", "parent_id", "slug"],
        },
        // {
        //   association: "models",
        //   attributes: ["id", "code", "title", "slug", "price"],
        //   // Price filter on models
        //   ...(priceMin || priceMax ? {
        //     where: {
        //       ...(priceMin && { price: { [Op.gte]: parseFloat(priceMin) } }),
        //       ...(priceMax && { price: { [Op.lte]: parseFloat(priceMax) } })
        //     },
        //     required: true // Inner join if price filter active
        //   } : {})
        // },
        {
          association: "sectors",
          attributes: ["id", "name", "name_ar", "slug"],
          through: { attributes: [] },
          ...(sectorCondition ? { where: sectorCondition, required: true } : {}),
        },
        {
          association: "projectImages",
          attributes: ["id", "media_path", "media_alt", "media_alt_ar"],
        },
      ];

      // Add attribute filters if provided
      // Attributes are linked through: ProductBase -> models -> variants -> variant_attributes
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeConditions = [];
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
          includeArray.push({
            association: "models",
            attributes: ["id"],
            required: true,
            include: [
              {
                association: "variants",
                attributes: ["id"],
                required: true,
                include: [
                  {
                    association: "variant_attributes",
                    attributes: ["id"],
                    where: {
                      [Op.or]: attributeConditions,
                    },
                    required: true,
                  },
                ],
              },
            ],
          });
        }
      }

      // Calculate offset for pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Fetch products with filters
      const { count, rows: baseProducts } = await models.ProductBase.findAndCountAll({
        where: whereClause,
        attributes: ["id", "title", "title_ar", "description", "description_ar", "media_path", "slug", "category_id"],
        include: includeArray,
        order: orderClause,
        limit: parseInt(limit),
        offset: offset,
        distinct: true, // Important for count with includes
        subQuery: false,
      });

      // Format products
      const products = baseProducts.map((product) => {
        const json = product.toJSON();
        return {
          ...json,
          media_path: generateImageUrl(json.media_path),
          projectImages:
            json.projectImages?.map((img) => ({
              ...img,
              media_path: generateImageUrl(img.media_path),
            })) || [],
        };
      });

      return {
        data: {
          products,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
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

  static async getProductListingNew(params) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        categories: categoriesParam,
        subCategories: subCategoriesParam,
        sectors: sectorsParam,
        attributes: attributesParam,
        sortBy,
      } = params;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

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

      // Parse attributes parameter (handle both string and object inputs)
      const parseAttributesParam = (param) => {
        if (!param) return {};
        if (typeof param === "object") return param;
        if (typeof param === "string") {
          try {
            return JSON.parse(param);
          } catch (e) {
            console.error("Error parsing attributes:", e);
            return {};
          }
        }
        return {};
      };

      const categories = parseArrayParam(categoriesParam);
      const subCategories = parseArrayParam(subCategoriesParam);
      const sectors = parseArrayParam(sectorsParam);
      const attributes = parseAttributesParam(attributesParam);

      // Build ProductBase WHERE clause for category filtering
      const productWhereClause = { status: true };
      const allCategoryIds = [...categories, ...subCategories];

      if (category && allCategoryIds.length === 0) {
        productWhereClause.category_id = parseInt(category);
      }
      if (allCategoryIds.length > 0) {
        productWhereClause.category_id = { [Op.in]: allCategoryIds };
      }

      const hasSectorFilter = sectors.length > 0;

      // Build attribute filter conditions
      const attributeConditions = [];
      if (attributes && Object.keys(attributes).length > 0) {
        Object.entries(attributes).forEach(([attributeId, valueIds]) => {
          if (valueIds && Array.isArray(valueIds) && valueIds.length > 0) {
            attributeConditions.push({
              attribute_id: parseInt(attributeId),
              attribute_value_id: { [Op.in]: valueIds.map((id) => parseInt(id)) },
            });
          }
        });
      }

      // Build ORDER BY clause (operates on ProductVariants)
      let orderClause = [["createdAt", "DESC"]];
      switch (sortBy) {
        case "price-low-high":
          orderClause = [["price", "ASC"]];
          break;
        case "price-high-low":
          orderClause = [["price", "DESC"]];
          break;
        case "name-a-z":
          orderClause = [[literal(`(SELECT pb.title FROM product_models pm INNER JOIN product_base pb ON pb.id = pm.product_id WHERE pm.id = "ProductVariants"."product_model_id")`), "ASC"]];
          break;
        case "name-z-a":
          orderClause = [[literal(`(SELECT pb.title FROM product_models pm INNER JOIN product_base pb ON pb.id = pm.product_id WHERE pm.id = "ProductVariants"."product_model_id")`), "DESC"]];
          break;
        default:
          orderClause = [["createdAt", "DESC"]];
      }

      // Build filter includes (minimal attributes - used for filtering only)
      const productInclude = {
        association: "product",
        attributes: [],
        required: true,
        where: productWhereClause,
        include: hasSectorFilter
          ? [
              {
                association: "sectors",
                attributes: [],
                through: { attributes: [] },
                where: { id: { [Op.in]: sectors } },
                required: true,
              },
            ]
          : [],
      };

      const filterInclude = [
        {
          association: "productModel",
          attributes: [],
          required: true,
          include: [productInclude],
        },
      ];

      if (attributeConditions.length > 0) {
        filterInclude.push({
          association: "variant_attributes",
          attributes: [],
          where: { [Op.or]: attributeConditions },
          required: true,
        });
      }

      const variantWhere = { status: true, is_primary: true };

      // Step 1: Get total count of matching variants
      const totalCount = await models.ProductVariants.count({
        where: variantWhere,
        include: filterInclude,
        distinct: true,
        col: "id",
      });

      if (totalCount === 0) {
        return {
          data: {
            products: [],
            pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
          },
          fromCache: false,
          message: "Data fetched successfully",
        };
      }

      // Step 2: Get paginated variant IDs (GROUP BY handles row duplication from many-to-many joins)
      const paginatedVariants = await models.ProductVariants.findAll({
        where: variantWhere,
        attributes: ["id"],
        include: filterInclude,
        order: orderClause,
        limit: limitNum,
        offset,
        subQuery: false,
        group: ["ProductVariants.id"],
      });

      const variantIds = paginatedVariants.map((v) => v.id);

      if (variantIds.length === 0) {
        return {
          data: {
            products: [],
            pagination: { total: totalCount, page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCount / limitNum) },
          },
          fromCache: false,
          message: "Data fetched successfully",
        };
      }

      // Step 3: Fetch full data for the paginated variant IDs
      const products = await models.ProductVariants.findAll({
        where: { id: { [Op.in]: variantIds } },
        attributes: [
          "id",
          "sku",
          "product_code",
          "price",
          "is_primary",
          "product_model_id",
          [
            literal(`
        CASE
          WHEN (
            SELECT COUNT(*)
            FROM product_variants pv
            WHERE pv.product_model_id = "ProductVariants"."product_model_id"
            AND pv.status = true
          ) > 1
          THEN true
          ELSE false
        END
      `),
            "has_more_items",
          ],
        ],
        include: [
          {
            association: "productModel",
            attributes: ["id", "title", "title_ar", "slug"],
            include: [
              {
                association: "product",
                attributes: ["id", "title", "title_ar", "slug", "media_path"],
                include: [
                  {
                    association: "category",
                    attributes: ["id", "name", "name_ar"],
                  },
                ],
              },
            ],
          },
        ],
        order: orderClause,
      });

      const transformedData = products.map((item) => {
        const json = item.toJSON();
        return {
          id: json.id,
          sku: json.sku,
          title: json.productModel?.product?.title,
          title_ar: json.productModel?.product?.title_ar,
          slug: json.productModel?.product?.slug,
          product_code: json.product_code,
          cover_image: generateImageUrl(json.productModel?.product?.media_path),
          variants_available: json.has_more_items,
          price: json.price,
          category: json.productModel?.product?.category?.name || null,
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
