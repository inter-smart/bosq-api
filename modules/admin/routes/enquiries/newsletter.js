const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/NewsLetterController");
const authMiddleware = require("../../http/middleware/authMiddleware");


router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.delete("/:id", Controller.destroy);

module.exports = router;
