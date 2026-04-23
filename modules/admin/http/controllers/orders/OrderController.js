const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models/index.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler.js");

const { Op, literal } = require("sequelize");

const { validateId, validateUpdate } = require("../../request/orders/ordersRequest.js");
const { paginate } = require("../../traits/datatablePaginationHelper.js");
const OrderService = require("../../../../frontend/http/services/orderService.js");

const DataModel = models.Orders;

class OrderController {
  static async index(req, res) {
    try {
      const { status } = req.query;
      const where = {};
      if (status && status !== "all") {
        where.status = status;
      }

      const result = await paginate(DataModel, req, {
        order: [["createdAt", "DESC"]],
        where,
        include: [
          {
            model: models.Users,
            as: "user",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "email",
              "name",
              [literal(`CONCAT_WS(' ', "user"."country_code", "user"."mobile")`), "mobile"],
            ],
          },
          {
            model: models.OrderAddress,
            as: "addresses",
            where: { address_type: "billing" },
            required: false,
          },
        ],
        searchFields: ["order_id", "$user.name$", "$addresses.name$", "$addresses.email$", "$addresses.phone$"],
      });

      const list = result.data.map((order) => {
        const orderData = order.toJSON();
        if (!orderData.user && orderData.addresses && orderData.addresses.length > 0) {
          const billing = orderData.addresses[0];
          orderData.user = {
            name: billing.name,
            email: billing.email,
            mobile: (billing.country_code || "") + " " + (billing.phone || ""),
            is_guest: true,
          };
        }
        return orderData;
      });

      const response = {
        list: list,
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
            attributes: ["id", "first_name", "last_name", "email", "mobile", "name"],
          },
          {
            model: models.OrderItem,
            as: "items",
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "media_path"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "title", "media_path", "price"],
              },
            ],
          },
          {
            model: models.OrderAddress,
            as: "addresses",
            include: [
              {
                model: models.State,
                as: "state",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      const user = data?.user;

      if (!data) {
        return sendNotFoundError(res, "Order");
      }

      const orderData = data.toJSON();
      if (!orderData.user && orderData.addresses && orderData.addresses.length > 0) {
        const billing = orderData.addresses.find((a) => a.address_type === "billing") || orderData.addresses[0];
        orderData.user = {
          name: user ? user.name : billing.name,
          email: user ? user.email : billing.email,
          mobile: (billing.country_code || "") + " " + (billing.phone || ""),
        };
      }

      sendSuccessResponse(res, orderData, "Order retrieved successfully");
    } catch (error) {
      console.error("Order show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all(validateUpdate.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { est_delivery_details, awb_number, order_url, partner_name, status, cancel_reason } = req.body;

      const order = await DataModel.findByPk(id, {
        include: [
          {
            model: models.Users,
            as: "user",
          },
          {
            model: models.Users,
            as: "user",
          },
          {
            model: models.OrderAddress,
            as: "addresses",
          },
          {
            model: models.OrderItem,
            as: "items",
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title", "media_path"],
              },
              {
                model: models.ProductVariants,
                as: "variant",
                attributes: ["id", "sku", "title", "media_path", "price", "stock", "status"],
              },
            ],
          },
        ],
      });

      if (!order) {
        await transaction.rollback();
        return sendNotFoundError(res, "Order");
      }

      if (status && status !== order.status) {
        if (status === "delivered" && order.status !== "shipped") {
          await transaction.rollback();
          return sendErrorResponse(res, new Error("Order must be shipped before it can be delivered"));
        }
        if (status === "shipped" && order.status !== "packed") {
          await transaction.rollback();
          return sendErrorResponse(res, new Error("Order must be packed before it can be shipped"));
        }
        if (status === "packed" && order.status !== "confirmed") {
          await transaction.rollback();
          return sendErrorResponse(res, new Error("Order must be confirmed before it can be packed"));
        }
      }

      const oldStatus = order.status;
      const orderType = order.payment_type;

      const isCodAndDelivered = orderType === "cod" && status === "delivered";

      await order.update({
        est_delivery_details,
        awb_number,
        order_url,
        partner_name,
        ...(status ? { status } : {}),
        ...(isCodAndDelivered ? { payment_status: "paid" } : {}),
      });

      if (status == "cancelled" || status == "returned") {
        await OrderService.revertOrderStock(order.id, transaction);
      }

      if (status && oldStatus !== status) {
        OrderService.sendOrderStatusEmail(order.id, status, cancel_reason).catch((err) => console.error("Error sending order status email:", err));
      }

      await transaction.commit();

      sendSuccessResponse(res, order, "Order updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Order update error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = OrderController;
