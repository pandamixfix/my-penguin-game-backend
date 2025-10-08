// src/controllers/ratingController.js
const ratingService = require('../services/ratingService');

const ratingController = {};

ratingController.getCurrentPlayer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const player = await ratingService.getPlayerProgress(userId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    
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
    next(error);
  }
};

ratingController.savePlayerProgress = async (req, res, next) => {
  try {
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

ratingController.getTopPlayers = async (req, res, next) => {
    try {
        const topPlayers = await ratingService.getTopPlayers();
        const playersToSend = topPlayers.map(player => ({
            ...player,
            id: player.id.toString(),
            score: player.score ? player.score.toString() : '0',
        }));
        res.status(200).json(playersToSend);
    } catch (error) {
        next(error);
    }
};
ratingController.purchaseUpgrade = async (req, res, next) => {
  try {
    const { userId, upgradeId } = req.body;
    if (!userId || !upgradeId) {
      return res.status(400).json({ message: 'userId and upgradeId are required' });
    }
    const updatedPlayer = await ratingService.purchaseUpgrade(userId, upgradeId);
    res.status(200).json(updatedPlayer); // Отправляем полный объект игрока
  } catch (error) {
    next(error);
  }
};

module.exports = ratingController;