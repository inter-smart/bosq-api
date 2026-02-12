
const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/WishListService.js");
class WishListController {

    static async addToWishlist(req, res) {
        try {
            const data = await service.addToWishlist(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "WishListController.addToWishlist");
        }
    }


     static async getWishlist(req, res) {
        try {
            const data = await service.getWishlist(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "WishListController.getWishlist");
        }
    }


     static async removeFromWishlist(req, res) {
        try {
            const data = await service.removeFromWishlist(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "WishListController.removeFromWishlist");
        }
    }
}

module.exports = WishListController;