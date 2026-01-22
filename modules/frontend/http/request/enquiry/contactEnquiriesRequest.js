const { body, validationResult } = require("express-validator");
const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS } = require("../../traits/constants");

exports.validationRequestPost = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ max: 255 })
    .withMessage("Name must not exceed 255 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),

  body("phone")
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),

  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string"),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, {
      message: "Validation failed",
      errors: errors.array(),
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  }
  next();
};
