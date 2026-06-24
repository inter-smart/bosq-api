const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/policy/WarrantyPolicyController.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");
const requirePermission = require("../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [
    { name: "media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("warranty-policy", fields);

router.use(requirePermission("policies"));
router.get("/", Controller.index);


router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;
