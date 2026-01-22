const { body, validationResult } = require("express-validator");
const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS } = require("../traits/constants");

exports.validationRequestPost = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
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
