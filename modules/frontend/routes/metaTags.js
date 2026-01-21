const express = require("express");
const router = express.Router();
const MetaTagController = require("../http/controllers/MetaTagContoller");

router.get("/:page", (req, res) => {
  MetaTagController.index(req, res);
});

module.exports = router;
