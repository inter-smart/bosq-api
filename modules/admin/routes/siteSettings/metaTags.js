const express = require("express");
const router = express.Router();
const requirePermission = require("../../http/middleware/requirePermission.js");
const Controller = require("../../http/controllers/siteSettings/MetaTagsController.js");


router.get("/", Controller.index);


router.get("/:id", Controller.show);

// Protected routes (require admin auth)
router.use(requirePermission("settings"));
router.post("/", Controller.store);
router.put("/:id", Controller.update);
// router.delete("/:id", Controller.destroy);

module.exports = router;
