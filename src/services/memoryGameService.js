// src/services/memoryGameService.js (НОВАЯ, ИСПРАВЛЕННАЯ ВЕРСИЯ С PRISMA)

// --- ИЗМЕНЕНИЕ: Используем Prisma вместо Supabase Client ---
const prisma = require('../../lib/prisma.js');
const ratingService = require('./ratingService'); 

const COOLDOWN_MS = 8 * 60 * 60 * 1000;
const CARD_VALUES = ['burger', 'fries', 'salat', 'shashlik', 'sushi', 'tort'];
const GAME_DURATION_SECONDS = 45;

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const memoryGameService = {};

memoryGameService.getGameStatus = async (userId) => {
  const numericUserId = parseInt(userId, 10); // Prisma ожидает число
  const gameState = await prisma.memory_game_state.findUnique({
    where: { user_id: numericUserId },
  });

  if (gameState?.current_game_state && gameState.time_left_ms > 0) {
    return { 
      status: 'confirmContinue', 
      cards: gameState.current_game_state,
      timeLeft: Math.floor(gameState.time_left_ms / 1000)
    };
  }

  if (gameState?.last_game_started_at) {
    const lastPlayTime = new Date(gameState.last_game_started_at).getTime();
    const cooldownEndTime = lastPlayTime + COOLDOWN_MS;
    if (new Date().getTime() < cooldownEndTime) {
      return { status: 'cooldown', cooldownEndTime };
    }
  }
  
  return { status: 'rules' };
};

memoryGameService.startGame = async (userId) => {
  const numericUserId = parseInt(userId, 10);
  const newCards = shuffleArray([...CARD_VALUES, ...CARD_VALUES]).map((val, i) => ({ 
    id: i, type: val, isFlipped: true, isMatched: false 
  }));

  await prisma.memory_game_state.upsert({
    where: { user_id: numericUserId },
    update: {
      current_game_state: newCards,
      time_left_ms: GAME_DURATION_SECONDS * 1000,
      last_game_started_at: null
    },
    create: {
      user_id: numericUserId,
      current_game_state: newCards,
      time_left_ms: GAME_DURATION_SECONDS * 1000,
    }
  });

  return { cards: newCards, timeLeft: GAME_DURATION_SECONDS };
};

memoryGameService.saveGameState = async (userId, cards, timeLeft) => {
  const numericUserId = parseInt(userId, 10);
  await prisma.memory_game_state.update({
    where: { user_id: numericUserId },
    data: {
      current_game_state: cards,
      time_left_ms: timeLeft * 1000,
    },
  });
  return { message: 'State saved' };
};

memoryGameService.endGame = async (userId, outcome, stars, fullPlayerProgress) => {
  const numericUserId = parseInt(userId, 10);
  let earnedGold = 0;
  if (outcome === 'won') {
    earnedGold = stars * 100;
  }

  await prisma.memory_game_state.update({
    where: { user_id: numericUserId },
    data: {
      last_game_started_at: new Date().toISOString(),
      current_game_state: null,
      time_left_ms: 0,
    }
  });

  if (earnedGold > 0) {
    const updatedProgress = {
      ...fullPlayerProgress,
      gold: fullPlayerProgress.gold + earnedGold,
    };
    await ratingService.savePlayerProgress(updatedProgress);
  }
  
  return { earnedGold };
};

module.exports = memoryGameService;