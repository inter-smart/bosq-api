const { param } = require("express-validator");

const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

module.exports = { validateId };
