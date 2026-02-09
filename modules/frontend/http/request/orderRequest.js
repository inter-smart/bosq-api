const { body, param, query } = require("express-validator");

const addressFields = (prefix) => [
  body(`${prefix}.name`)
    .notEmpty()
    .withMessage(`${prefix} name is required`)
    .isString()
    .isLength({ max: 150 })
    .withMessage(`${prefix} name must be at most 150 characters`),

  body(`${prefix}.company_name`)
    .notEmpty()
    .withMessage(`${prefix} company name is required`)
    .isString()
    .isLength({ max: 150 })
    .withMessage(`${prefix} company name must be at most 150 characters`),

  body(`${prefix}.email`)
    .notEmpty()
    .withMessage(`${prefix} email is required`)
    .isEmail()
    .withMessage(`${prefix} email must be a valid email address`),

  body(`${prefix}.phone`)
    .notEmpty()
    .withMessage(`${prefix} phone is required`)
    .isString()
    .isLength({ max: 20 })
    .withMessage(`${prefix} phone must be at most 20 characters`),

  body(`${prefix}.street_address`).notEmpty().withMessage(`${prefix} street address is required`).isString(),

  body(`${prefix}.country_code`).optional().isString().isLength({ max: 5 }).withMessage(`${prefix} country code must be at most 5 characters`),

  body(`${prefix}.apartment`).optional().isString().isLength({ max: 150 }).withMessage(`${prefix} apartment must be at most 150 characters`),

  body(`${prefix}.state_id`).optional().isInt({ min: 1 }).withMessage(`${prefix} state ID must be a positive integer`),

  body(`${prefix}.order_notes`).optional().isString(),
];

exports.placeOrderRequest = [
  body("payment_type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn(["cod", "online"])
    .withMessage("Payment type must be either 'cod' or 'online'"),

  // body("address")
  //   .notEmpty()
  //   .withMessage("Address is required")
  //   .isObject()
  //   .withMessage("Address must be an object"),

  // body("address.billing")
  //   .notEmpty()
  //   .withMessage("Billing address is required")
  //   .isObject()
  //   .withMessage("Billing address must be an object"),

  // body("address.shipping")
  //   .optional()
  //   .isObject()
  //   .withMessage("Shipping address must be an object"),

  // ...addressFields("address.billing"),
  // ...addressFields("address.shipping"),
];

exports.getOrderByIdRequest = [
  param("orderId").notEmpty().withMessage("Order ID is required").isInt({ min: 1 }).withMessage("Order ID must be a positive integer"),
];

exports.cancelOrderRequest = [
  param("orderId").notEmpty().withMessage("Order ID is required").isInt({ min: 1 }).withMessage("Order ID must be a positive integer"),
];

exports.getOrdersRequest = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
];
