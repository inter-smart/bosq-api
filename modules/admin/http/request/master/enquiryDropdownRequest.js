const { body, param } = require("express-validator");

exports.validateEnquiryDropdown = [
    body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
    body("title_ar").optional().isString().withMessage("Arabic title must be a string"),
    body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
    body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [
    param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")
];
