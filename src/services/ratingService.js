// src/services/ratingService.js
const prisma = require('../lib/prisma.js');

const ratingService = {};

ratingService.getPlayerProgress = async (userId) => {
  const numericUserId = BigInt(userId);

  const player = await prisma.players_fidele_game.findUnique({
    where: { id: numericUserId },
    include: {
      player_upgrades: true,
    },
  });

  return player;
};

ratingService.savePlayerProgress = async (progressData) => {
  const { id, name, score, gold, upgrades } = progressData;
  const numericUserId = BigInt(id);

  return prisma.$transaction(async (tx) => {
    const player = await tx.players_fidele_game.upsert({
      where: { id: numericUserId },
      update: { score: BigInt(score), gold, name },
      create: { id: numericUserId, score: BigInt(score), gold, name },
    });

    const upgradePromises = upgrades.map(upgrade => 
      tx.player_upgrades.upsert({
        where: {
          player_id_upgrade_type: {
            player_id: numericUserId,
            upgrade_type: upgrade.upgrade_type,
          },
        },
        update: { level: upgrade.level },
        create: {
          player_id: numericUserId,
          upgrade_type: upgrade.upgrade_type,
          level: upgrade.level,
        },
      })
    );

    await Promise.all(upgradePromises);

    return player;
  });
};

ratingService.getTopPlayers = async () => {
  const topPlayers = await prisma.players_fidele_game.findMany({
    orderBy: { score: 'desc' },
    take: 30,
  });
  return topPlayers;
};

module.exports = ratingService;