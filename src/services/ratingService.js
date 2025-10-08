// Вверху файла импортируем конфиг
const { shopItemsConfig } = require('../../../packages/shared-config/shopConfig'); 
const prisma = require('../../lib/prisma');

const ratingService = {};

// ... (твои существующие функции getPlayerProgress, savePlayerProgress...)

ratingService.purchaseUpgrade = async (userId, upgradeId) => {
  const numericUserId = parseInt(userId, 10);

  // 1. Найти конфиг улучшения на сервере
  const itemConfig = shopItemsConfig.find(item => item.id === upgradeId);
  if (!itemConfig) {
    throw new Error('Invalid upgrade ID');
  }

  // 2. Выполняем все в транзакции для 100% надежности
  return prisma.$transaction(async (tx) => {
    const player = await tx.players_fidele_game.findUnique({
      where: { id: numericUserId },
      include: { player_upgrades: true },
    });

    if (!player) throw new Error('Player not found');

    const currentUpgrade = player.player_upgrades.find(upg => upg.upgrade_type === upgradeId);
    const currentLevel = currentUpgrade ? currentUpgrade.level : 0;

    // 3. ВАЛИДАЦИЯ НА СЕРВЕРЕ
    if (currentLevel >= itemConfig.maxLevel) {
      throw new Error('Maximum level reached');
    }

    // 4. Расчет цены на сервере из массива costs
    const cost = itemConfig.costs[currentLevel];
    if (player.gold < cost) {
      throw new Error('Not enough gold');
    }

    // 5. Обновляем данные
    await tx.players_fidele_game.update({
      where: { id: numericUserId },
      data: { gold: player.gold - cost },
    });

    await tx.player_upgrades.upsert({
      where: { player_id_upgrade_type: { player_id: numericUserId, upgrade_type: upgradeId } },
      update: { level: currentLevel + 1 },
      create: { player_id: numericUserId, upgrade_type: upgradeId, level: 1 },
    });
    
    // 6. Возвращаем полный обновленный стейт игрока
    return tx.players_fidele_game.findUnique({
        where: { id: numericUserId },
        include: { player_upgrades: true }
    });
  });
};

module.exports = ratingService;