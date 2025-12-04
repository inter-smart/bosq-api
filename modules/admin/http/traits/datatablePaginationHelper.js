const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");

// Helper function to create search condition based on field type
const createSearchCondition = (field, searchValue, Model) => {
  const attribute = Model.rawAttributes[field];
  
  // Check if field is numeric type (INTEGER, BIGINT, DECIMAL, FLOAT, etc.)
  const isNumeric = attribute && [
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'FLOAT',
    'DOUBLE',
    'REAL',
    'NUMERIC'
  ].includes(attribute.type.key);

  if (isNumeric) {
    // For numeric fields, cast to text for searching
    return Sequelize.where(
      Sequelize.cast(Sequelize.col(field), 'TEXT'),
      { [Op.iLike]: `%${searchValue}%` }
    );
  } else {
    // For text fields, use regular ILIKE
    return {
      [field]: { [Op.iLike]: `%${searchValue}%` },
    };
  }
};

module.exports = {
  paginate: async (Model, req, options = {}) => {
    const { limit, page = 1, search, keyword } = req.query;

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const searchTerm = search || keyword;
    const isSearchApplied = Boolean(searchTerm);

    // Build base query options
    const queryOptions = {
      ...options,
      offset,
      limit: parsedLimit,
      subQuery: false,
      distinct: true, 
    };

    // ... rest of your search logic ...

    const { count, rows } = await Model.findAndCountAll(queryOptions);

    return {
      data: rows,
      pagination: {
        // If count is an array (when using distinct with includes), get length
        totalCount: Array.isArray(count) ? count.length : count,
        totalPages: Math.ceil((Array.isArray(count) ? count.length : count) / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
        isSearchApplied,
      },
    };
  },
};