// my-react-app-backend/src/controllers/ratingController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// const supabase = require('../supabaseClient'); // <--- ЗАКОММЕНТИРОВАЛИ
const ratingController = {};

ratingController.getTopPlayers = async (req, res) => {
  try {
    const topPlayersData = await prisma.players_fidele_game.findMany({
      take: 30,
      orderBy: { score: 'desc' },
    });

    const topPlayers = topPlayersData.map((user, index) => {
      const player = { 
        ...user, 
        id: user.id.toString(),
        score: user.score.toString(),
        place: index + 1 
      };
      if (index === 0) player.rank = 'gold';
      if (index === 1) player.rank = 'silver';
      if (index === 2) player.rank = 'bronze';
      return player;
    });

    res.json(topPlayers);
  } catch (error) {
    console.error('Ошибка в getTopPlayers:', error);
    res.status(500).json({ message: "Ошибка сервера при чтении рейтинга" });
  }
};

ratingController.getCurrentPlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'null') {
      return res.status(404).json({ message: "Игрок не найден (неверный ID)" });
    }

    const userIdBigInt = BigInt(userId);
    const user = await prisma.players_fidele_game.findUnique({ where: { id: userIdBigInt } });

    if (!user) {
      return res.status(404).json({ message: "Игрок не найден в базе" });
    }
    
    const playersAhead = await prisma.players_fidele_game.count({
      where: { score: { gt: user.score } },
    });

    res.json({ 
      ...user, 
      id: user.id.toString(),
      score: user.score.toString(),
      place: playersAhead + 1 
    });
  } catch (error) {
    console.error('Ошибка в getCurrentPlayer:', error);
    res.status(500).json({ message: "Ошибка сервера при поиске игрока" });
  }
};

ratingController.addClick = async (req, res) => {
  const { userId, userName, clickCount = 1 } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId не был предоставлен' });
  }
  
  const userIdBigInt = BigInt(userId);
  try {
    await prisma.players_fidele_game.upsert({
      where: { id: userIdBigInt },
      update: { score: { increment: clickCount } },
      create: {
        id: userIdBigInt,
        name: userName || `Пингвин #${userId.slice(0, 4)}`,
        score: clickCount,
      },
    });

    /* --- УБРАЛИ ОТПРАВКУ REAL-TIME СООБЩЕНИЯ ---
    const channel = supabase.channel('rating-updates');
    await channel.send({
      type: 'broadcast',
      event: 'new_click',
      payload: { message: `User ${userId} clicked!` },
    });
    */

    res.status(200).json({ message: `Клики (${clickCount}) успешно засчитаны!` });
  } catch (error) {
    console.error('Ошибка в addClick:', error);
    res.status(500).json({ message: "Ошибка сервера при обновлении кликов" });
  }
};

module.exports = ratingController;