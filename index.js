require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ratingRoutes = require('./src/routes/ratingRoutes');
const telegramRoutes = require('./src/routes/telegramRoutes');
const errorHandler = require('./src/utils/errorHandler');
const memoryGameRoutes = require('./src/routes/memoryGameRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'https://n8nvps.devpixelka.ru'
];

// Настройка CORS остается такой же, она у тебя хорошая
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// --- ИСПРАВЛЕННЫЙ ПОРЯДОК РОУТОВ ---
// Все роуты должны быть объявлены ДО обработчика ошибок

app.use('/', telegramRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/game', memoryGameRoutes); // <-- Перемещен сюда

// --- ОБРАБОТЧИК ОШИБОК ТЕПЕРЬ В САМОМ КОНЦЕ ---
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  if (!process.env.DATABASE_URL) {
      console.error('FATAL ERROR: DATABASE_URL is not defined in .env file.');
      process.exit(1);
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.warn('WARNING: Telegram integration variables are not defined.');
  } else {
    console.log(`Telegram check configured for channel: ${process.env.TELEGRAM_CHANNEL_ID}`);
  }
  
  console.log('Server configuration loaded successfully.');
});