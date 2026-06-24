const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/AdminUsersController.js");
const requirePermission = require("../http/middleware/requirePermission.js");

// Managing staff accounts is super-admin only.
router.use(requirePermission());

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.put("/:id/reset-password", Controller.resetPassword);
router.delete("/:id", Controller.destroy);

module.exports = router;
