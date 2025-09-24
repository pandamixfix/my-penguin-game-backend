// src/routes/telegramRoutes.js

const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

router.post('/verify-subscription', telegramController.verifySubscription);

module.exports = router;