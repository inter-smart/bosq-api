const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/faq/FaqListController.js");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// router.use(authMiddleware(["admin"]));

router.get("/dropdown", Controller.getFaqDropDown);
router.get("/dropdown/models", Controller.getFaqModelsDropdown);
router.get("/dropdown/categories", Controller.getFaqCategoriesDropdown);
router.get("/dropdown/variants", Controller.getFaqVariantsDropdown);
router.get("/", Controller.index);

router.get("/:id", Controller.show);
// Protected routes (require admin auth)
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);


module.exports = router;
