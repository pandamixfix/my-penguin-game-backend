// src/controllers/ratingController.js

const supabase = require('../config/supabaseClient'); 

const ratingController = {};

// Этот код в порядке, не трогаем
ratingController.getTopPlayers = async (req, res) => {
  try {
    const { data: topPlayersData, error } = await supabase
      .from('players_fidele_game')
      .select('*')
      .order('score', { ascending: false, nullsFirst: false }) 
      .limit(30);
    if (error) throw error;
    const topPlayers = topPlayersData
      .filter(user => user && user.id)
      .map((user, index) => {
        const player = { 
          ...user, 
          id: String(user.id), score: String(user.score || 0),
          name: user.name || `Пингвин #${String(user.id).slice(0,4)}`,
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

// --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
ratingController.getCurrentPlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'null') {
      return res.status(404).json({ message: "Игрок не найден (неверный ID)" });
    }

    // Превращаем текстовый ID из URL в число
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({ message: "Некорректный формат ID" });
    }

    // Ищем игрока по числовому ID
    const { data: user, error: userError } = await supabase
      .from('players_fidele_game')
      .select('*')
      .eq('id', numericUserId) // Используем число для поиска
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: "Игрок не найден в базе" });
    }
    
    const { count: playersAhead, error: countError } = await supabase
        .from('players_fidele_game')
        .select('*', { count: 'exact', head: true })
        .gt('score', user.score || 0);

    if (countError) throw countError;

    res.json({ 
      ...user, 
      id: String(user.id),
      score: String(user.score || 0),
      name: user.name || `Пингвин #${String(user.id).slice(0,4)}`,
      place: (playersAhead || 0) + 1 
    });
  } catch (error) {
    console.error('Ошибка в getCurrentPlayer:', error);
    res.status(500).json({ message: "Ошибка сервера при поиске игрока" });
  }
};

// Этот код в порядке, не трогаем
ratingController.addClick = async (req, res) => {
  // ... (код без изменений)
  const { userId, userName, clickCount = 1 } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId не был предоставлен' });
  }
  try {
    const { error } = await supabase.rpc('increment_score', {
        user_id_in: userId,
        user_name_in: userName || `Пингвин #${String(userId).slice(0, 4)}`,
        increment_amount: clickCount
    });
    if (error) throw error;
    res.status(200).json({ message: `Клики (${clickCount}) успешно засчитаны!` });
  } catch (error) {
    console.error('Ошибка в addClick:', error);
    res.status(500).json({ message: "Ошибка сервера при обновлении кликов" });
  }
};

module.exports = ratingController;