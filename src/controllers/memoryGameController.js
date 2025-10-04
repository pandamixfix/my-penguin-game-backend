// src/controllers/memoryGameController.js

const memoryGameService = require('../services/memoryGameService');

const memoryGameController = {};

memoryGameController.getGameStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const statusData = await memoryGameService.getGameStatus(userId);
    res.status(200).json(statusData);
  } catch (error) {
    next(error);
  }
};

memoryGameController.startGame = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    const gameData = await memoryGameService.startGame(userId);
    res.status(200).json(gameData);
  } catch (error) {
    next(error);
  }
};

memoryGameController.saveGameState = async (req, res, next) => {
    try {
        const { userId, cards, timeLeft } = req.body;
        if (!userId || !cards || timeLeft == null) {
            return res.status(400).json({ message: 'Invalid data for saving state.' });
        }
        const result = await memoryGameService.saveGameState(userId, cards, timeLeft);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

memoryGameController.endGame = async (req, res, next) => {
  try {
    const { userId, outcome, stars, fullPlayerProgress } = req.body;
    if (!userId || !outcome || stars == null || !fullPlayerProgress) {
        return res.status(400).json({ message: 'Invalid data for ending game.' });
    }
    const result = await memoryGameService.endGame(userId, outcome, stars, fullPlayerProgress);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


module.exports = memoryGameController;