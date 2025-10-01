// src/controllers/ratingController.js

const supabase = require('../config/supabaseClient'); 

const ratingController = {};

// --- 1. ПОЛУЧЕНИЕ ТОП-ИГРОКОВ ---
ratingController.getTopPlayers = async (req, res) => {
  try {
    const { data: topPlayersData, error } = await supabase
      .from('players_fidele_game')
      .select('*')
      .order('score', { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Делаем код устойчивым к null в базе данных
    const topPlayers = topPlayersData.map((user, index) => {
      const player = { 
        ...user, 
        // Если id или score вдруг null, используем 0 как запасной вариант
        id: String(user.id || 'N/A'),
        score: String(user.score || 0),
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

// --- 2. ПОЛУЧЕНИЕ ТЕКУЩЕГО ИГРОКА ---
ratingController.getCurrentPlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'null' || userId === '12345678') { // Добавил тестового юзера для надежности
      return res.status(404).json({ message: "Тестовый игрок не найден в рейтинге" });
    }

    const { data: user, error: userError } = await supabase
      .from('players_fidele_game')
      .select('*')
      .eq('id', userId)
      .single();

    // Эта проверка правильная. Если игрока нет, вернется 404.
    if (userError || !user) {
      return res.status(404).json({ message: "Игрок не найден в базе" });
    }
    
    const { count: playersAhead, error: countError } = await supabase
        .from('players_fidele_game')
        .select('*', { count: 'exact', head: true })
        .gt('score', user.score || 0); // Добавил || 0 на всякий случай

    if (countError) {
        throw countError;
    }

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Также делаем этот блок устойчивым к null
    res.json({ 
      ...user, 
      id: String(user.id || 'N/A'),
      score: String(user.score || 0),
      place: playersAhead + 1 
    });
  } catch (error) {
    console.error('Ошибка в getCurrentPlayer:', error);
    res.status(500).json({ message: "Ошибка сервера при поиске игрока" });
  }
};

// --- 3. ОБНОВЛЕНИЕ/ДОБАВЛЕНИЕ ОЧКОВ (Этот код в порядке, не трогаем) ---
ratingController.addClick = async (req, res) => {
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

    if (error) {
        throw error;
    }

    res.status(200).json({ message: `Клики (${clickCount}) успешно засчитаны!` });
  } catch (error) {
    console.error('Ошибка в addClick:', error);
    res.status(500).json({ message: "Ошибка сервера при обновлении кликов" });
  }
};

module.exports = ratingController;