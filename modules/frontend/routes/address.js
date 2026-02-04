const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/AddressController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");

router.use(verifyToken());

router.get("/", Controller.index);
router.get("/:id", Controller.get);
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);
router.put("/:id/default", Controller.setDefault);

module.exports = router;