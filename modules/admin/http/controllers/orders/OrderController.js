const { validationResult } = require("express-validator");
const {
  sequelize,
  models,
} = require("../../../../../database/models/index.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler.js");

const { Op, literal } = require("sequelize");

const { validateId } = require("../../request/orders/ordersRequest.js");
const { paginate } = require("../../traits/datatablePaginationHelper.js");

const DataModel = models.Orders;

class OrderController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: models.Users,
            as: "user",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              [
                literal(
                  `CONCAT_WS(' ', "user"."country_code", "user"."mobile")`,
                ),
                "mobile",
              ],
            ],
          },
        ],
        searchFields: ["order_id", "email"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Orders retrieved successfully");
    } catch (error) {
      console.error("Order index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, {
        include: [
          {
            model: models.Users,
            as: "user",
            attributes: ["id", "first_name", "last_name", "email", "mobile"],
          },
          {
            model: models.OrderItem,
            as: "items",
          },
          {
            model: models.OrderAddress,
            as: "addresses",
          },
        ],
      });

      if (!data) {
        return sendNotFoundError(res, "Order");
      }

      sendSuccessResponse(res, data, "Order retrieved successfully");
    } catch (error) {
      console.error("Order show error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = OrderController;
