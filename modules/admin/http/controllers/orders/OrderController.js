const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models/index.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler.js");

const { Op, literal } = require("sequelize");

const { validateId, validateUpdate } = require("../../request/orders/ordersRequest.js");
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

    try {
      const { id } = req.params;
      const { est_delivery_details, awb_number, order_url, partner_name, status } = req.body;

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
        return sendNotFoundError(res, "Order");
      }

      if (status && status !== order.status) {
        if (status === "delivered" && order.status !== "shipped") {
          return sendErrorResponse(res, new Error("Order must be shipped before it can be delivered"));
        }
        if (status === "shipped" && order.status !== "packed") {
          return sendErrorResponse(res, new Error("Order must be packed before it can be shipped"));
        }
      }

      const oldStatus = order.status;

      await order.update({
        est_delivery_details,
        awb_number,
        order_url,
        partner_name,
        ...(status ? { status } : {}),
      });

      if (oldStatus === "pending" && status === "confirmed") {
        const EmailService = require("../../../../../services/EmailService");

        let userEmail = null;
        let userName = "Customer";

        if (order.user) {
          userEmail = order.user.email;
          userName = order.user.name || order.user.first_name;
        } else if (order.addresses && order.addresses.length > 0) {
          userEmail = order.addresses[0].email;
          userName = order.addresses[0].name;
        }

        if (userEmail) {
          const billingAddress = order.addresses?.find((a) => a.address_type === "billing");
          const shippingAddress = order.addresses?.find((a) => a.address_type === "shipping");

          const itemsData = (order.items || []).map((item) => {
            const productTitle = item.variant?.title || item.product?.title || "Product";
            const itemPriceStr = typeof item.price === "string" ? item.price : String(item.price);
            const discountAmtStr = typeof item.discount_amount === "string" ? item.discount_amount : String(item.discount_amount || "0");

            const p = parseFloat(itemPriceStr) || 0;
            const q = item.quantity || 1;
            const d = parseFloat(discountAmtStr) || 0;
            const linetotal = (p * q) - d;

            return {
              title: productTitle,
              sku: item.variant?.sku,
              quantity: item.quantity,
              price: itemPriceStr,
              discount_amount: discountAmtStr,
              line_total: String(linetotal),
              image: item.variant?.media_path || item.product?.media_path
            };
          });

          EmailService.sendOrderStatusUpdate(userEmail, {
            name: userName,
            orderCode: order.order_id,
            status: status,
            paymentType: order.payment_type,
            subtotal: order.subtotal,
            discount_total: order.discount_total,
            tax_total: order.tax_total,
            grand_total: order.grand_total,
            estDelivery: order.est_delivery_details,
            items: itemsData,
            billingAddress: billingAddress,
            shippingAddress: shippingAddress
          }).catch(err => console.error("Error sending order status email:", err));
        }
      }

      sendSuccessResponse(res, order, "Order updated successfully");
    } catch (error) {
      console.error("Order update error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = OrderController;
