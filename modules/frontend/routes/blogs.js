const express = require('express');
const BlogController = require('../http/controllers/BlogController');

const router = express.Router();


router.get("/", BlogController.index);

module.exports = router;