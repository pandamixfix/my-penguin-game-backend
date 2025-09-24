// index.js

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! UNHANDLED REJECTION !!!');
  console.error('Причина:', reason);
  console.error('Промис:', promise);
  // Завершаем процесс, чтобы Docker его перезапустил
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('!!! UNCAUGHT EXCEPTION !!!');
  console.error('Ошибка:', error);
  // Завершаем процесс, чтобы Docker его перезапустил
  process.exit(1);
});
// =================================================================


require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Подключаем middleware
app.use(cors({
  origin: 'http://localhost:5173' // Явно разрешаем запросы только с твоего фронтенда
}));
app.use(express.json({ type: ['application/json', 'text/plain'] }));

// Импортируем наши маршруты
const telegramRoutes = require('./src/routes/telegramRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');

// Используем маршруты с префиксами
app.use('/', telegramRoutes); // Адрес будет /verify-subscription
app.use('/api/rating', ratingRoutes); // Адреса будут /api/rating/top и /api/rating/me/:userId

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер слушает порт ${PORT}`);
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.error('ОШИБКА: Проверь, что TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID заданы в файле .env');
  } else {
    console.log('Конфигурация сервера успешно загружена.');
    console.log(`Проверка будет осуществляться для канала: ${process.env.TELEGRAM_CHANNEL_ID}`);
  }
});