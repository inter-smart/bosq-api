
const { Op } = require('sequelize');

module.exports = {
  paginate: async (Model, req, options = {}) => {
    const { limit, page = 1, keyword } = req.query;


    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const dynamicIlike = keyword ? `%${keyword}%` : `%%`;
    const isSearchApplied = Boolean(keyword);

    // Build base query options
    const queryOptions = {
      ...options, // Spread any additional options passed in
      offset,
      limit: parsedLimit
    };

    // Add search if keyword exists and searchFields are provided
    if (keyword && options.searchFields) {
      queryOptions.where = {
        ...queryOptions.where, // Preserve existing where conditions
        [Op.or]: options.searchFields.map(field => ({
          [field]: { [Op.iLike]: dynamicIlike }
        }))
      };
    }

    const { count, rows } = await Model.findAndCountAll(queryOptions);

    return {
      data: rows,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
        isSearchApplied
      }
    };
  }
};


