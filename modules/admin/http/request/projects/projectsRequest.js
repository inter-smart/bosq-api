const { body, param } = require("express-validator");

exports.validateProjects = [
  /* ---------- CATEGORY ---------- */
  body("category_id").optional().isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),

  /* ---------- TITLES ---------- */
  body("title").optional().isString().withMessage("Title must be a string"),

  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),

  /* ---------- DESCRIPTIONS ---------- */
  body("description").optional().isString().withMessage("Description must be a string"),

  body("description_ar").optional().isString().withMessage("Arabic description must be a string"),

  /* ---------- MEIDAS ---------- */
  body("thumbnail").optional().isString().withMessage("Thumbnail must be a string"),

  body("section1_meida").optional().isString().withMessage("Section 1 meida must be a string"),

  body("section1_meida_alt").optional().isString().withMessage("Section 1 meida alt must be a string"),

  body("section1_media_alt_ar").optional().isString().withMessage("Section 1 meida alt (AR) must be a string"),

  body("section3_meida").optional().isString().withMessage("Section 3 meida must be a string"),

  body("section3_meida_alt").optional().isString().withMessage("Section 3 meida alt must be a string"),

  body("section3_meida_alt_ar").optional().isString().withMessage("Section 3 meida alt (AR) must be a string"),

  /* ---------- SECTION 3 CONTENT ---------- */
  body("section3_title").optional().isString().withMessage("Section 3 title must be a string"),

  body("section3_title_ar").optional().isString().withMessage("Section 3 Arabic title must be a string"),

  body("section3_description").optional().isString().withMessage("Section 3 description must be a string"),

  body("section3_description_ar").optional().isString().withMessage("Section 3 Arabic description must be a string"),

  /* ---------- SECTION 4 ---------- */
  body("section4_title").optional().isString().withMessage("Section 4 title must be a string"),

  body("section4_title_ar").optional().isString().withMessage("Section 4 Arabic title must be a string"),

  /* ---------- SEO ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  body("meta_title").optional().isString().withMessage("Meta title must be a string"),

  body("meta_description").optional().isString().withMessage("Meta description must be a string"),

  body("meta_keywords").optional().isString().withMessage("Meta keywords must be a string"),

  body("meta_title_ar").optional().isString().withMessage("Arabic meta title must be a string"),

  body("meta_description_ar").optional().isString().withMessage("Arabic meta description must be a string"),

  body("meta_keywords_ar").optional().isString().withMessage("Arabic meta keywords must be a string"),

  /* ---------- JSONB FIELDS ---------- */
  body("tags").optional(),

  body("features").optional(),
  body("tags_ar").optional(),

  body("features_ar").optional(),

  /* ---------- SORT & STATUS ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),

  body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

/* ---------- PARAM ID VALIDATION ---------- */
exports.validateId = [param("id").isInt({ min: 1 }).withMessage("Project ID must be a positive integer")];
