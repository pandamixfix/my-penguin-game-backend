// src/services/memoryGameService.js

const supabase = require('../supabaseClient');
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
  const { data, error } = await supabase
    .from('memory_game_state')
    .select('last_game_started_at, current_game_state, time_left_ms')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { 
    throw new Error('Failed to fetch game status from database.');
  }

  if (data?.current_game_state && data.time_left_ms > 0) {
    return { 
      status: 'confirmContinue', 
      cards: data.current_game_state,
      timeLeft: Math.floor(data.time_left_ms / 1000)
    };
  }

  if (data?.last_game_started_at) {
    const lastPlayTime = new Date(data.last_game_started_at).getTime();
    const cooldownEndTime = lastPlayTime + COOLDOWN_MS;
    if (new Date().getTime() < cooldownEndTime) {
      return { status: 'cooldown', cooldownEndTime };
    }
  }
  
  return { status: 'rules' };
};

memoryGameService.startGame = async (userId) => {
  const newCards = shuffleArray([...CARD_VALUES, ...CARD_VALUES]).map((val, i) => ({ 
    id: i, 
    type: val, 
    isFlipped: true,
    isMatched: false 
  }));

  const { data, error } = await supabase.from('memory_game_state').upsert({
    user_id: userId,
    current_game_state: newCards,
    time_left_ms: GAME_DURATION_SECONDS * 1000,
    last_game_started_at: null
  }, { onConflict: 'user_id' });

  if (error) {
    throw new Error('Failed to start game.');
  }

  return { cards: newCards, timeLeft: GAME_DURATION_SECONDS };
};

memoryGameService.saveGameState = async (userId, cards, timeLeft) => {
  const { error } = await supabase.from('memory_game_state').update({
    current_game_state: cards,
    time_left_ms: timeLeft * 1000,
  }).eq('user_id', userId);

  if (error) {
    throw new Error('Failed to save game state.');
  }
  return { message: 'State saved' };
};

memoryGameService.endGame = async (userId, outcome, stars, fullPlayerProgress) => {
  let earnedGold = 0;
  if (outcome === 'won') {
    earnedGold = stars * 100;
  }

  const { error } = await supabase.from('memory_game_state').update({
    last_game_started_at: new Date().toISOString(),
    current_game_state: null,
    time_left_ms: 0,
  }).eq('user_id', userId);

  if (error) {
    throw new Error('Failed to update game end state.');
  }

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