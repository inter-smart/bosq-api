const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CommonActionsController");
const authMiddleware = require("../http/middleware/authMiddleware");

router.use(authMiddleware(["admin"]));

router.get("/categories/child-categories", Controller.getChildCategories);
router.get("/attributes/with-values", Controller.getAttributesWithValues);

router.put("/status/:model_name/:row_id", Controller.updateStatus);
router.put("/sort-order/:model_name/:row_id", Controller.updateSortOrder);

module.exports = router;
