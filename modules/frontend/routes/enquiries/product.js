const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/ProductEnquiryController.js");
const { validationRequestPost, handleValidationErrors } = require("../../http/request/productEnquiriesRequest.js");
const { createUploadMiddleware } = require("../../../admin/http/middleware/multerMiddleware.js");


const fields = [
    { name: "media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("product-enquiry", fields);


router.post("/",  upload, validationRequestPost, handleValidationErrors, Controller.store);

module.exports = router