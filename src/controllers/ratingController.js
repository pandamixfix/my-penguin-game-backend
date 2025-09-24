// my-react-app-backend/src/controllers/ratingController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// --- ДОБАВЛЕНО: Импортируем клиент Supabase для отправки real-time сообщений ---
const supabase = require('../supabaseClient'); 
const ratingController = {};

ratingController.getTopPlayers = async (req, res) => {
  try {
    const topPlayersData = await prisma.players_fidele_game.findMany({
      take: 30,
      orderBy: { score: 'desc' },
    });

    // --- ИСПРАВЛЕНО: Конвертируем BigInt в String для каждого игрока ---
    // JSON не умеет работать с BigInt, поэтому это обязательный шаг.
    const topPlayers = topPlayersData.map((user, index) => {
      const player = { 
        ...user, 
        id: user.id.toString(),         // Конвертируем ID
        score: user.score.toString(),   // Конвертируем очки
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

    // --- ИСПРАВЛЕНО: Конвертируем BigInt в String перед отправкой JSON ---
    res.json({ 
      ...user, 
      id: user.id.toString(),         // Конвертируем ID
      score: user.score.toString(),   // Конвертируем очки
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

    // --- ДОБАВЛЕНО: Отправляем real-time сигнал всем клиентам, что рейтинг обновился ---
    const channel = supabase.channel('rating-updates');
    await channel.send({
      type: 'broadcast',
      event: 'new_click',
      payload: { message: `User ${userId} clicked!` },
    });
    // ------------------------------------------------------------------------------------

    res.status(200).json({ message: `Клики (${clickCount}) успешно засчитаны!` });
  } catch (error) {
    console.error('Ошибка в addClick:', error);
    res.status(500).json({ message: "Ошибка сервера при обновлении кликов" });
  }
};

module.exports = ratingController;