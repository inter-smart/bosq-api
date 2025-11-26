const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/statusController");

// router.use(authMiddleware(["admin"]));

router.post("/:model_name/:row_id", Controller.update);

module.exports = router;