const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/AddressController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { verifyUserSession } = require("../http/middleware/staleUserMiddleware.js");

router.get("/", optionalAuth(), cartContext, Controller.index);
router.get("/:id", optionalAuth(), cartContext, Controller.get);
router.post("/", optionalAuth(), cartContext, Controller.store);
router.put("/:id", optionalAuth(), cartContext, Controller.update);
router.delete("/:id", optionalAuth(), cartContext, Controller.destroy);
router.put("/:id/default", optionalAuth(), cartContext, Controller.setDefault);

module.exports = router;
