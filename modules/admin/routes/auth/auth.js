const express = require('express');
const router = express.Router();
const authMiddleware = require('../../http/middleware/authMiddleware');
const Controller = require('../../http/controllers/AuthController');


router.post('/register', Controller.register);
router.post('/login', Controller.login);

router.use(authMiddleware(['admin']));
// router.post('/logout', Controller.logout);

module.exports = router;