const express = require('express');
const router = express.Router();
const Controller = require('../http/controllers/DeliveryRulesController');

router.get('/states', Controller.getStatesByCountry);
router.put('/states/:stateId', Controller.updateDeliveryRules);

module.exports = router;
