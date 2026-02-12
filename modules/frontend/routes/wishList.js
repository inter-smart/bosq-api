const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/WishListController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");

router.use(verifyToken());
router.get("/", Controller.getWishlist);
router.post("/", Controller.addToWishlist);
router.delete("/:id", Controller.removeFromWishlist);

module.exports = router;
