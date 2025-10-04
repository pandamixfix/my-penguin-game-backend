// src/controllers/ratingController.js
const ratingService = require('../services/ratingService');

const ratingController = {};

// GET /me/:userId
ratingController.getCurrentPlayer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const player = await ratingService.getPlayerProgress(userId);

    if (!player) {
      // Стандартный ответ для "не найдено"
      return res.status(404).json({ message: "Player not found" });
    }
    
    // Форматируем данные для фронтенда
    const responseData = {
      score: player.score ? player.score.toString() : '0',
      gold: player.gold,
      upgrades: player.player_upgrades.map(upg => ({
        upgrade_type: upg.upgrade_type,
        level: upg.level
      })),
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Передаем ошибку в централизованный обработчик
  }
};

// POST /save
ratingController.savePlayerProgress = async (req, res, next) => {
  try {
    // Валидация входных данных - must have для senior-кода
    const { id, name, score, gold, upgrades } = req.body;
    if (!id || !name || score == null || gold == null || !upgrades) {
        return res.status(400).json({ message: "Invalid input data" });
    }

    await ratingService.savePlayerProgress(req.body);
    res.status(200).json({ message: "Progress saved successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /top
ratingController.getTopPlayers = async (req, res, next) => {
    try {
        const topPlayers = await ratingService.getTopPlayers();
        // ... здесь ваша логика маппинга для добавления рангов
        res.status(200).json(topPlayers);
    } catch (error) {
        next(error);
    }
};

module.exports = ratingController;