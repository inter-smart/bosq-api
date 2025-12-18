const express = require("express");
const router = express.Router();
const authMiddleware = require('../../http/middleware/authMiddleware');
const Controller = require("../../http/controllers/siteSettings/MetaTagsController.js");


router.get("/", Controller.index);


router.get("/:id", Controller.show);

// Protected routes (require admin auth)
router.use(authMiddleware(["admin"]));

router.post("/", Controller.store);
router.put("/:id", Controller.update);
// router.delete("/:id", Controller.destroy);

module.exports = router;
