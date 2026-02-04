const { param } = require("express-validator");

// Validate user ID
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];
