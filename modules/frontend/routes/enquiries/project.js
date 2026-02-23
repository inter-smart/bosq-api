const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/ProjectEnquiryController.js");
const { validationRequestPost, handleValidationErrors } = require("../../http/request/projectEnquiriesRequest.js");

router.post("/", validationRequestPost, handleValidationErrors, Controller.store);

module.exports = router;
