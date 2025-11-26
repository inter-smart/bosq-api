const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CommonActionsController");

// router.use(authMiddleware(["admin"]));

router.put("/status/:model_name/:row_id", Controller.updateStatus);
router.put("/sort-order/:model_name/:row_id", Controller.updateSortOrder);

module.exports = router;
