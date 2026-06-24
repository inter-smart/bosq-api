const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/DeliveryRulesController");
const requirePermission = require("../http/middleware/requirePermission");

router.get("/states", Controller.getStatesByCountry);
router.use(requirePermission("cms"));
router.put("/states/:stateId", Controller.updateDeliveryRules);

module.exports = router;
