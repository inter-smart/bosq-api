const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/RolesController.js");
const requirePermission = require("../http/middleware/requirePermission.js");

// Managing roles/permissions is super-admin only.
router.use(requirePermission());

router.get("/permissions-catalog", Controller.permissionsCatalog);
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;
