const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // QUESTION
  body("question")
    .notEmpty()
    .withMessage("Question is required")
    .isString()
    .withMessage("Question must be a string"),

  body("question_ar")
    .notEmpty()
    .withMessage("Question in Arabic is required")
    .isString()
    .withMessage("Question in Arabic must be a string"),

  // ANSWER
  body("answer")
    .notEmpty()
    .withMessage("Answer is required")
    .isString()
    .withMessage("Answer must be a string"),

  body("answer_ar")
    .notEmpty()
    .withMessage("Answer in Arabic is required")
    .isString()
    .withMessage("Answer in Arabic must be a string"),

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status").isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];
