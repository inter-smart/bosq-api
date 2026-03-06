const { param, body } = require("express-validator");

exports.validateId = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID must be a positive integer"),
];

exports.validateUpdate = [
    ...exports.validateId,
    body("status")
        .optional()
        .isIn(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"])
        .withMessage("Invalid status value"),
    body("cancel_reason")
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage("Cancel reason must be less than 500 characters"),
];
