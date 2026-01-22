const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/ContactController.js");
const { validationRequestPost, handleValidationErrors } = require("../../http/request/contactEnquiriesRequest.js");

// POST route for submitting brochure enquiry
router.post("/", validationRequestPost, handleValidationErrors, Controller.store);

module.exports = router;
