// src/routes/ratingRoutes.js

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.get('/top', ratingController.getTopPlayers);
router.get('/me/:userId', ratingController.getCurrentPlayer);
router.post('/click', ratingController.addClick);

module.exports = router;