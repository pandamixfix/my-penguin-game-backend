// src/routes/ratingRoutes.js

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.get('/top', ratingController.getTopPlayers);
router.get('/me/:userId', ratingController.getCurrentPlayer);
router.post('/save', ratingController.savePlayerProgress);
router.post('/upgrade', ratingController.purchaseUpgrade);
module.exports = router;

module.exports = router;