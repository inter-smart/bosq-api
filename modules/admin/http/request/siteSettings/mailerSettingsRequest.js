const { body, param } = require("express-validator");

const validateType = [
  param("type")
    .isIn(["auth", "enquiries", "newsletter", "orders", "admin"])
    .withMessage("type must be one of: auth, enquiries, newsletter, orders, admin"),
];

const validateUpdate = [
  body("to_email")
    .notEmpty()
    .withMessage("to_email is required")
    .isEmail()
    .withMessage("to_email must be a valid email address")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("cc_emails")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === "") return true;
      const emails = value.split(",").map((e) => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = emails.filter((e) => !emailRegex.test(e));
      if (invalid.length > 0) {
        throw new Error(`Invalid CC email(s): ${invalid.join(", ")}`);
      }
      return true;
    }),
];

module.exports = { validateType, validateUpdate };
