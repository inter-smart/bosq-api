const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../../http/controllers/resources/product/ProductBulkImageUploadController");

// Ensure the staging directory exists at startup
const STAGING_DIR = path.join(__dirname, "../../../../uploads/bulk-staging");
fs.mkdirSync(STAGING_DIR, { recursive: true });

// Disk storage: preserve original filename but add a unique prefix to avoid
// collisions when multiple uploads happen concurrently in the staging area.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, STAGING_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Final name in staging: "<timestamp>-<random>-<originalname>"
    // The worker reads file.originalname separately and uses it for the bulk/ destination.
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
    files: 100, // max 100 files per request
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Only images (jpg, png, webp, gif, bmp, svg, tiff) and videos (mp4, webm, mov, avi, mkv) are allowed.`,
        ),
        false,
      );
    }
  },
});

// POST /api/backend/resources/product-bulk-image-upload/upload
router.post("/upload", upload.array("files", 100), Controller.upload);

// GET /api/backend/resources/product-bulk-image-upload/status/:jobId
router.get("/status/:jobId", Controller.getStatus);

module.exports = router;
