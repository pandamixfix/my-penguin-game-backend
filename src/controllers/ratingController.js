// Заменяем prisma на наш новый supabase клиент
const supabase = require('../config/supabaseClient'); 

const ratingController = {};

// --- 1. ПОЛУЧЕНИЕ ТОП-ИГРОКОВ ---
ratingController.getTopPlayers = async (req, res) => {
  try {
    // Вместо prisma.findMany используем синтаксис Supabase
    const { data: topPlayersData, error } = await supabase
      .from('players_fidele_game') // Указываем таблицу
      .select('*')                 // Выбираем все колонки
      .order('score', { ascending: false }) // Сортируем по очкам (score) по убыванию
      .limit(30);                   // Ограничиваем выборку 30 игроками

    // Если Supabase вернул ошибку, отправляем ее на фронтенд
    if (error) {
      throw error;
    }

    // Эта часть кода остается без изменений, она форматирует данные для фронтенда
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

// --- 2. ПОЛУЧЕНИЕ ТЕКУЩЕГО ИГРОКА ---
ratingController.getCurrentPlayer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'null') {
      return res.status(404).json({ message: "Игрок не найден (неверный ID)" });
    }

    // Ищем одного конкретного игрока по его ID
    const { data: user, error: userError } = await supabase
      .from('players_fidele_game')
      .select('*')
      .eq('id', userId) // .eq() это "equals", аналог "where id = userId"
      .single(); // .single() говорит, что мы ожидаем только одну запись

    if (userError) {
      // Если .single() не нашел игрока, он вернет ошибку, которую мы обработаем
      return res.status(404).json({ message: "Игрок не найден в базе" });
    }
    
    // Считаем, сколько игроков имеют больше очков
    const { count: playersAhead, error: countError } = await supabase
        .from('players_fidele_game')
        .select('*', { count: 'exact', head: true }) // head:true для эффективности, нам нужно только число
        .gt('score', user.score); // .gt() это "greater than", т.е. "score > user.score"

    if (countError) {
        throw countError;
    }

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

// --- 3. ОБНОВЛЕНИЕ/ДОБАВЛЕНИЕ ОЧКОВ (САМОЕ ВАЖНОЕ!) ---
ratingController.addClick = async (req, res) => {
  const { userId, userName, clickCount = 1 } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId не был предоставлен' });
  }
  
  try {
    // Вместо prisma.upsert мы будем использовать "удаленную процедуру" (RPC)
    // Это специальная функция внутри самой базы данных. Это самый правильный и безопасный способ.
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