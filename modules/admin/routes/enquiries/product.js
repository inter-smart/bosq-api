const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/ProductEnquiryController");
const requirePermission = require("../../http/middleware/requirePermission.js");
router.use(requirePermission("enquiries"));
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.delete("/:id", Controller.destroy);

module.exports = router;
