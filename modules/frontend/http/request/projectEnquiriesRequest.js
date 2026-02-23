const { body, validationResult } = require("express-validator");

const validationRequestPost = [
  body("project_id")
    .notEmpty()
    .withMessage("Project is required")
    .isInt({ min: 1 })
    .withMessage("Invalid project"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ max: 255 })
    .withMessage("Name must not exceed 255 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),

  body("message")
  .optional({ checkFalsy: true })
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validationRequestPost,
  handleValidationErrors,
};
