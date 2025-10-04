// src/routes/memoryGameRoutes.js

const express = require('express');
const router = express.Router();
const memoryGameController = require('../controllers/memoryGameController');

router.get('/status/:userId', memoryGameController.getGameStatus);
router.post('/start', memoryGameController.startGame);
router.post('/state', memoryGameController.saveGameState);
router.post('/end', memoryGameController.endGame);

module.exports = router;