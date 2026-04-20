const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendSuccessResponse, sendErrorResponse } = require("../http/traits/responseHandler");

const uploadPath = path.join("uploads", "editor-media");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return sendErrorResponse(res, "No file uploaded", null, 400);

    const filePath = path.join("uploads", "editor-media", req.file.filename).replace(/\\/g, "/");
    sendSuccessResponse(res, { path: filePath }, "Image uploaded successfully");
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

module.exports = router;
