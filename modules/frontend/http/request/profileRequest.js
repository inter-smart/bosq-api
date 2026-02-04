const { body, validationResult } = require("express-validator");
const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS } = require("../traits/constants");

exports.personalInfoRequestPost = [
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string")
    .isLength({ max: 255 })
    .withMessage("First name must not exceed 255 characters"),

  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string")
    .isLength({ max: 255 })
    .withMessage("Last name must not exceed 255 characters"),
  body("display_name")
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

  body("country_code")
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),

  body("mobile")
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),
];

exports.changePasswordRequestPost = [
  // password
  body("currentPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ max: 255 })
    .withMessage("Password must not exceed 255 characters"),

  body("newPassword")
    .notEmpty()
    .withMessage("New Password is required")
    .isString()
    .withMessage("New Password must be a string")
    .isLength({ max: 255 })
    .withMessage("New Password must not exceed 255 characters"),
    
]


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
