// src/controllers/telegramController.js

const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

exports.verifySubscription = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId не был предоставлен' });
  }
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`;
  console.log(`Проверяем пользователя ${userId} в канале ${CHANNEL_ID}...`);
  try {
    const response = await axios.get(TELEGRAM_API_URL, {
      params: { chat_id: CHANNEL_ID, user_id: userId },
    });
    const status = response.data.result.status;
    console.log(`Статус пользователя: ${status}`);
    const isSubscribed = ['member', 'administrator', 'creator'].includes(status);
    if (isSubscribed) {
      res.json({ isSubscribed: true, message: 'Пользователь подписан.' });
    } else {
      res.status(403).json({ isSubscribed: false, message: 'Пользователь не подписан на канал.' });
    }
  } catch (error) {
    console.error('Ошибка при запросе к API Telegram:', error.response?.data || error.message);
    res.status(500).json({ isSubscribed: false, error: 'Не удалось проверить подписку.' });
  }
};