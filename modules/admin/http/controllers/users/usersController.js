const { validationResult } = require("express-validator");
const { models } = require("../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler");
const { validateId } = require("../../request/users/UsersRequest");
const { paginate } = require("../../traits/datatablePaginationHelper");

const DataModel = models.Users;
const AddressModel = models.Address;

class UsersController {
  // List users with pagination and addresses
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [["created_at", "DESC"]],
        searchFields: ["name", "first_name", "last_name", "email"],
        attributes: { exclude: ["password"] },
        include: [
          {
            model: AddressModel,
            as: "addresses",
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Users retrieved successfully");
    } catch (error) {
      console.error("Users index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // Get single user with addresses
  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: AddressModel,
            as: "addresses",
            where: {
              is_default: true, // or 1 depending on your column type
            },
            required: false, // ⬅️ IMPORTANT (keeps user even if no default address)
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "User");

      sendSuccessResponse(res, data, "User retrieved successfully");
    } catch (error) {
      console.error("User show error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = UsersController;
