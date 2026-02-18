const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/addressService");

class AddressController {
  static async index(req, res) {
    try {
      const data = await service.index(req, res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.index");
    }
  }

  static async get(req, res) {
    try {
      const data = await service.get(req, res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.get");
    }
  }

  static async store(req, res) {
    try {
      const data = await service.store(req, res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_CREATED,
        data,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.store");
    }
  }

  static async update(req, res) {
    try {
      const data = await service.update(req, res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_UPDATED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.update");
    }
  }

  static async destroy(req, res) {
    const { id } = req.params;
    try {
      const cartOwner = req.cartOwner;
      const data = await service.destroy(cartOwner, id);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_DELETED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.destroy");
    }
  }

  static async setDefault(req, res) {
    const { id } = req.params;
    const { addressType } = req.body;
    try {
      const cartOwner = req.cartOwner;
      const data = await service.setDefault(cartOwner, id, addressType);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_UPDATED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "AddressController.setDefault");
    }
  }
}

module.exports = AddressController;
