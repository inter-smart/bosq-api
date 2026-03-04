const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");

// Helper function to create search condition based on field type
const createSearchCondition = (field, searchValue, Model) => {
  // Handle array of fields (concatenated search like ['first_name', 'last_name'])
  if (Array.isArray(field)) {
    return Sequelize.where(Sequelize.fn("CONCAT_WS", " ", ...field.map((f) => Sequelize.col(f))), { [Op.iLike]: `%${searchValue}%` });
  }

  // Handle association fields (e.g., 'state.name' or '$state.name$')
  if (field.includes(".") || (field.startsWith("$") && field.endsWith("$"))) {
    const formattedField = field.startsWith("$") ? field : `$${field}$`;
    return { [formattedField]: { [Op.iLike]: `%${searchValue}%` } };
  }

  const attribute = Model.rawAttributes[field];

  if (!attribute) {
    console.warn(`Field ${field} not found in model ${Model.name}`);
    return null;
  }

  // Check if field is numeric type
  const isNumeric = ["INTEGER", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE", "REAL", "NUMERIC"].includes(attribute.type.key);

  // Check if field is date/time type
  const isDate = ["DATE", "DATEONLY", "TIME"].includes(attribute.type.key);

  if (isNumeric) {
    // For numeric fields, cast to text for searching
    return Sequelize.where(Sequelize.cast(Sequelize.col(field), "TEXT"), { [Op.iLike]: `%${searchValue}%` });
  } else if (isDate) {
    // For date fields, cast to text for searching
    return Sequelize.where(Sequelize.cast(Sequelize.col(field), "TEXT"), { [Op.iLike]: `%${searchValue}%` });
  } else {
    // For text fields, use regular ILIKE
    return { [field]: { [Op.iLike]: `%${searchValue}%` } };
  }
};

module.exports = {
  paginate: async (Model, req, options = {}) => {
    const { limit, page = 1, search, keyword, searchFields, startDate, endDate } = req.query;

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const searchTerm = search || keyword;
    const isSearchApplied = Boolean(searchTerm);

    const { includeSubQuery, ...restOptions } = options;

    // Detect if any where-clause keys use $association.field$ notation — those
    // require a JOIN that the COUNT subquery won't have, so disable subQuery.
    const hasAssociationWhere = Object.keys(restOptions.where || {}).some(
      (key) => key.startsWith("$") && key.endsWith("$")
    );

    // Build base query options
    const queryOptions = {
      ...restOptions,
      offset,
      limit: parsedLimit,
      distinct: true,
      ...(includeSubQuery || hasAssociationWhere ? { subQuery: false } : {}),
    };

    // Apply date range filter
    if (startDate || endDate) {
      const dateCondition = {};
      const dateField = options.dateField || "createdAt";

      if (startDate && endDate) {
        // Both bounds: inclusive range (start of day → end of day)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition[dateField] = { [Op.between]: [start, end] };
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateCondition[dateField] = { [Op.gte]: start };
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition[dateField] = { [Op.lte]: end };
      }

      queryOptions.where = {
        ...(queryOptions.where || {}),
        ...dateCondition,
      };
    }

    // Apply search logic if search term exists
    if (searchTerm) {
      let fieldsToSearch = [];

      // Determine which fields to search
      if (searchFields) {
        // Use provided searchFields from query string (comma-separated)
        fieldsToSearch = searchFields.split(",").map((f) => f.trim());
      } else if (options.searchFields && Array.isArray(options.searchFields)) {
        // Use searchFields from options (can include arrays and association fields)
        fieldsToSearch = options.searchFields;
      } else {
        // Default: search all string/text fields
        fieldsToSearch = Object.keys(Model.rawAttributes).filter((field) => {
          const attr = Model.rawAttributes[field];
          return ["STRING", "TEXT", "CHAR", "VARCHAR"].includes(attr.type.key);
        });
      }

      // Build search conditions
      const searchConditions = fieldsToSearch
        .map((field) => createSearchCondition(field, searchTerm.trim(), Model))
        .filter((condition) => condition !== null);

      // If any search field references an association (e.g. "$product.title$"),
      // the COUNT subquery won't have the JOIN — disable subQuery to fix it.
      const hasAssociationField = fieldsToSearch.some(
        (field) =>
          !Array.isArray(field) &&
          (field.includes(".") || (field.startsWith("$") && field.endsWith("$")))
      );
      if (hasAssociationField) {
        queryOptions.subQuery = false;
      }

      // Add search conditions to where clause
      if (searchConditions.length > 0) {
        queryOptions.where = {
          ...(queryOptions.where || {}),
          [Op.or]: searchConditions,
        };
      }
    }

    // Execute query
    const { count, rows } = await Model.findAndCountAll(queryOptions);

    // Calculate total count (handle distinct case)
    const totalCount = Array.isArray(count) ? count.length : count;

    return {
      data: rows,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
        isSearchApplied,
        searchTerm: isSearchApplied ? searchTerm : null,
      },
    };
  },

  // Export helper for external use
  createSearchCondition,
};
