const { sendErrorResponse, sendSuccessResponse } = require("../../../../admin/http/traits/responseHandler");
const service = require("../../services/Products/ProductsService");

class ProductsController {
  static async getProductBySlug(req, res) {
    const { slug } = req.query;
    try {
      if (!slug) {
        return sendErrorResponse(res, null, "Product slug is required", 400);
      }
      const { data, message } = await service.getProductBySlug(slug);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = ProductsController;
