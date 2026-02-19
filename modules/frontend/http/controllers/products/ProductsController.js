const { sendErrorResponse, sendSuccessResponse } = require("../../../../admin/http/traits/responseHandler");
const service = require("../../services/Products/ProductsService");

class ProductsController {
  static async getProductBySlug(req, res) {
    const params = req.query;
    try {
      const { data, message } = await service.getProductBySlug(params);

      console.log(data);

      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
  static async getProductModelData(req, res) {
    const { slug } = req.query;
    try {
      if (!slug) {
        return sendErrorResponse(res, null, "Product model slug is required", 400);
      }
      const { data, message } = await service.getProductModelData(slug);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async getProductListing(req, res) {
    try {
      const params = req.query;
      const type = req?.cartOwner?.type || "guest";
      const userId = req?.cartOwner?.id || null;

      const { data, message } = await service.getProductListing(params, type, userId);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async getInitialProductList(req, res) {
    try {
      const { page, limit } = req.query;
      const { data, message } = await service.getInitialProductList(page, limit);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async productSearchList(req, res) {
    try {
      const params = req.query;
      const { data, message } = await service.productSearchList(params);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async productSearchListByKeywords(req, res) {
    try {
      const params = req.query;
      const { data, message } = await service.productSearchListByKeywords(req, res, params);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = ProductsController;
