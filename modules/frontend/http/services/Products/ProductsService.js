const { Op } = require("sequelize");
const { models } = require("../../../../../database/models/index");
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
      const baseProduct = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: productAttributes,
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
          { association: "models", attributes: ["id", "code", "title", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
          // faq
          {association: "faqs", attributes: ["id", "question", "question_ar", "answer", "answer_ar"]},
        ],
      });
      return {
        data: baseProduct || [],
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
      limit = 12
    } = params;


    console.log("params:", params)

    // Parse array parameters (handle both string and array inputs)
    const parseArrayParam = (param) => {
      if (!param) return [];
      if (Array.isArray(param)) return param.map(Number);
      if (typeof param === 'string') {
        return param.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
      return [];
    };

    // Parse attributes parameter (handle both string and object inputs)
    const parseAttributesParam = (param) => {
      if (!param) return {};
      if (typeof param === 'object') return param;
      if (typeof param === 'string') {
        try {
          return JSON.parse(param);
        } catch (e) {
          console.error('Error parsing attributes:', e);
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
      status: true
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
        [Op.in]: allCategoryIds
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
          [Op.in]: sectors
        }
      };
    }

    // Build ORDER BY clause
    let orderClause = [["createdAt", "DESC"]]; // default
    switch (sortBy) {
      // case "price-low-high":
      //   // This requires a subquery or join with models table
      //   orderClause = [[literal('(SELECT MIN(price) FROM product_models WHERE product_models.product_base_id = ProductBase.id)'), 'ASC']];
      //   break;
      // case "price-high-low":
      //   orderClause = [[literal('(SELECT MAX(price) FROM product_models WHERE product_models.product_base_id = ProductBase.id)'), 'DESC']];
      //   break;
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
        attributes: ["id", "name", "name_ar", "parent_id", "slug"] 
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
        ...(sectorCondition ? { where: sectorCondition, required: true } : {})
      },
      { 
        association: "projectImages", 
        attributes: ["id", "media_path", "media_alt", "media_alt_ar"] 
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
              [Op.in]: valueIds.map(id => parseInt(id))
            }
          });
        }
      });

      if (attributeConditions.length > 0) {
        includeArray.push({
          association: "models",
          attributes: ["id"],
          required: true,
          include: [{
            association: "variants",
            attributes: ["id"],
            required: true,
            include: [{
              association: "variant_attributes",
              attributes: ["id"],
              where: {
                [Op.or]: attributeConditions
              },
              required: true
            }]
          }]
        });
      }
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch products with filters
    const { count, rows: baseProducts } = await models.ProductBase.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "title",
        "title_ar",
        "description",
        "description_ar",
        "media_path",
        "slug",
        "category_id",
      ],
      include: includeArray,
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
      distinct: true, // Important for count with includes
      subQuery: false
    });

    // Format products
    const products = baseProducts.map(product => {
      const json = product.toJSON();
      return {
        ...json,
        media_path: generateImageUrl(json.media_path),
        projectImages: json.projectImages?.map(img => ({
          ...img,
          media_path: generateImageUrl(img.media_path)
        })) || []
      };
    });

    return {
      data: {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
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
