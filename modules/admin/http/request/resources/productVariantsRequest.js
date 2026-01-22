const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- PRODUCT ID ---------- */
  body("product_id").optional({ nullable: true }).isInt().withMessage("Product ID must be an integer"),

  /* ---------- SKU ---------- */
  body("sku").optional({ nullable: true }).isString().withMessage("SKU must be a string"),

  /* ---------- PRICE ---------- */
  // body("price").optional({ nullable: true }).isNumeric().withMessage("Price must be a number"),

  /* ---------- STOCK ---------- */
  body("stock").optional({ nullable: true }).isInt().withMessage("Stock must be an integer"),

  /* ---------- PRODUCT CODE ---------- */
  body("product_code").optional({ nullable: true }).isString().withMessage("Product code must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional({ nullable: true }).isInt().withMessage("Sort order must be an integer"),

  /* ---------- STATUS ---------- */
  body("status").optional({ nullable: true }).isBoolean().withMessage("Status must be true or false"),
];
exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];
