const express = require("express");
const router = express.Router();
const multer = require("multer");
const Controller = require("../../http/controllers/resources/product/ProductBulkUploadController");

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

// POST /api/backend/resources/product-bulk-upload/validate
router.post("/validate", upload.single("file"), Controller.validate);

// POST /api/backend/resources/product-bulk-upload/approve
router.post("/approve", Controller.approve);

// GET /api/backend/resources/product-bulk-upload/status/:jobId
router.get("/status/:jobId", Controller.getStatus);

module.exports = router;
