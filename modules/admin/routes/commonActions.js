const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CommonActionsController");
const requireAuth = require("../http/middleware/requireAuth.js");
router.use(requireAuth());
router.get("/categories/child-categories", Controller.getChildCategories);
router.get("/attributes/with-values", Controller.getAttributesWithValues);

router.put("/status/:model_name/:row_id", Controller.updateStatus);
router.put("/sort-order/:model_name/:row_id", Controller.updateSortOrder);
router.put("/is-primary/:model_name/:row_id", Controller.updateIsPrimary);
router.put("/show-in-footer/:model_name/:row_id", Controller.updateShowInFooter);

module.exports = router;
