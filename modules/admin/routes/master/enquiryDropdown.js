const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/master/EnquiryDropdownController.js");
const requirePermission = require("../../http/middleware/requirePermission.js");

router.use(requirePermission("cms"));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;
