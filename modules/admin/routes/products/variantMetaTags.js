const express = require("express");
const router = express.Router();
const multer = require("multer");
const Controller = require("../../http/controllers/resources/product/ProductMetaController");
const BulkController = require("../../http/controllers/resources/product/ProductMetaBulkController");
const requirePermission = require("../../http/middleware/requirePermission");

// Use memory storage — Excel file is parsed in-memory, not saved to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for large Excel files
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false);
    }
  },
});

router.use(requirePermission("products"));

// Bulk routes — registered before /:id so they aren't shadowed
router.post("/bulk/export", BulkController.exportSelected);
router.post("/bulk/validate", upload.single("file"), BulkController.validate);
router.post("/bulk/approve", BulkController.approve);
router.get("/bulk/status/:jobId", BulkController.getStatus);

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.put("/:id", Controller.update);

module.exports = router;
