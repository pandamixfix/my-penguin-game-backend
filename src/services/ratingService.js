const { shopItemsConfig } = require('../shared-config/shopConfig');
const prisma = require('../../lib/prisma');

const ratingService = {};

ratingService.getPlayerProgress = async (userId) => {
  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    throw new Error('Invalid User ID');
  }
  
  const player = await prisma.players_fidele_game.findUnique({
    where: { id: numericUserId },
    include: {
      player_upgrades: true,
    },
  });
  return player;
};

ratingService.savePlayerProgress = async (playerData) => {
  const { id, name, score, gold, upgrades } = playerData;
  const numericUserId = parseInt(id, 10);

  return prisma.$transaction(async (tx) => {
    await tx.players_fidele_game.upsert({
      where: { id: numericUserId },
      update: {
        name: name,
        score: BigInt(score),
        gold: gold,
      },
      create: {
        id: numericUserId,
        name: name,
        score: BigInt(score),
        gold: gold,
      },
    });

    if (upgrades && Array.isArray(upgrades)) {
      for (const upg of upgrades) {
        await tx.player_upgrades.upsert({
          where: {
            player_id_upgrade_type: {
              player_id: numericUserId,
              upgrade_type: upg.upgrade_type,
            },
          },
          update: { level: upg.level },
          create: {
            player_id: numericUserId,
            upgrade_type: upg.upgrade_type,
            level: upg.level,
          },
        });
      }
    }
    
    return { message: "Progress saved successfully" };
  });
};

ratingService.getTopPlayers = async () => {
    return prisma.players_fidele_game.findMany({
        orderBy: {
            score: 'desc',
        },
        take: 10,
    });
};

ratingService.purchaseUpgrade = async (userId, upgradeId, count) => {
  const numericUserId = parseInt(userId, 10);

  const itemConfig = shopItemsConfig.find(item => item.id === upgradeId);
  if (!itemConfig) {
    throw new Error('Invalid upgrade ID');
  }

  return prisma.$transaction(async (tx) => {
    const player = await tx.players_fidele_game.findUnique({
      where: { id: numericUserId },
      include: { player_upgrades: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    let currentGold = player.gold;
    let existingUpgrade = player.player_upgrades.find(upg => upg.upgrade_type === upgradeId);
    let currentLevel = existingUpgrade ? existingUpgrade.level : 0;
    
    let purchasedCount = 0;
    for (let i = 0; i < count; i++) {
      if (currentLevel >= itemConfig.maxLevel) {
        break;
      }

      const cost = itemConfig.costs[currentLevel];
      if (currentGold < cost) {
        break;
      }

      currentGold -= cost;
      currentLevel++;
      purchasedCount++;
    }

    if (purchasedCount > 0) {
      await tx.players_fidele_game.update({
        where: { id: numericUserId },
        data: { gold: currentGold },
      });

      await tx.player_upgrades.upsert({
        where: { player_id_upgrade_type: { player_id: numericUserId, upgrade_type: upgradeId } },
        update: { level: currentLevel },
        create: { player_id: numericUserId, upgrade_type: upgradeId, level: currentLevel },
      });
    }
    
    return tx.players_fidele_game.findUnique({
        where: { id: numericUserId },
        include: { player_upgrades: true }
    });
  });
};

module.exports = ratingService;