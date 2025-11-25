// 게임 시스템 유틸리티

export interface GameData {
  coins: number;
  characterLevel: number;
  characterExp: number;
  characterExpMax: number;
  consecutiveDays: number;
  completedQuests: number;
  lastActivityDate: string;
  questProgress: {
    [key: string]: {
      completed: boolean;
      progress: number;
      maxProgress: number;
    };
  };
}

const DEFAULT_GAME_DATA: GameData = {
  coins: 10000,
  characterLevel: 12,
  characterExp: 180,
  characterExpMax: 300,
  consecutiveDays: 7,
  completedQuests: 47,
  lastActivityDate: new Date().toISOString().split('T')[0],
  questProgress: {}
};

export function getGameData(): GameData {
  const saved = localStorage.getItem('gameData');
  if (saved) {
    try {
      const savedData = JSON.parse(saved);
      // 기존 데이터가 있으면 코인을 추가 (최소 10000으로 보장)
      if (savedData.coins < 10000) {
        savedData.coins = Math.max(savedData.coins + 8750, 10000);
        saveGameData(savedData);
      }
      return { ...DEFAULT_GAME_DATA, ...savedData };
    } catch (e) {
      console.error('Failed to load game data:', e);
    }
  }
  return DEFAULT_GAME_DATA;
}

export function saveGameData(data: GameData): void {
  localStorage.setItem('gameData', JSON.stringify(data));
}

export function addCoins(amount: number): number {
  const gameData = getGameData();
  gameData.coins += amount;
  saveGameData(gameData);
  return gameData.coins;
}

export function addCharacterExp(amount: number): { level: number; exp: number; expMax: number; leveledUp: boolean } {
  const gameData = getGameData();
  let leveledUp = false;
  
  gameData.characterExp += amount;
  
  // 레벨업 체크
  while (gameData.characterExp >= gameData.characterExpMax) {
    gameData.characterExp -= gameData.characterExpMax;
    gameData.characterLevel += 1;
    gameData.characterExpMax = Math.floor(gameData.characterExpMax * 1.2); // 레벨업 시 필요 경험치 증가
    leveledUp = true;
  }
  
  saveGameData(gameData);
  
  return {
    level: gameData.characterLevel,
    exp: gameData.characterExp,
    expMax: gameData.characterExpMax,
    leveledUp
  };
}

export function updateConsecutiveDays(): number {
  const gameData = getGameData();
  const today = new Date().toISOString().split('T')[0];
  
  if (gameData.lastActivityDate !== today) {
    const lastDate = new Date(gameData.lastActivityDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // 연속 기록 유지
      gameData.consecutiveDays += 1;
    } else if (diffDays > 1) {
      // 연속 기록 끊김
      gameData.consecutiveDays = 1;
    }
    
    gameData.lastActivityDate = today;
    saveGameData(gameData);
  }
  
  return gameData.consecutiveDays;
}

export function completeQuest(questId: string, reward: number): { coins: number; exp: number; leveledUp: boolean } {
  const gameData = getGameData();
  
  if (!gameData.questProgress[questId]?.completed) {
    gameData.questProgress[questId] = {
      completed: true,
      progress: 1,
      maxProgress: 1
    };
    gameData.completedQuests += 1;
    
    const newCoins = addCoins(reward);
    const expResult = addCharacterExp(Math.floor(reward / 2)); // 코인의 절반만큼 경험치
    
    saveGameData(gameData);
    
    return {
      coins: newCoins,
      exp: expResult.exp,
      leveledUp: expResult.leveledUp
    };
  }
  
  return {
    coins: gameData.coins,
    exp: gameData.characterExp,
    leveledUp: false
  };
}

export function trackActivity(activityType: 'symptom' | 'diary' | 'environment' | 'management' | 'emotional'): void {
  const gameData = getGameData();
  const today = new Date().toISOString().split('T')[0];
  
  // 활동별 코인 보상
  const rewards: Record<string, number> = {
    symptom: 10,
    diary: 15,
    environment: 5,
    management: 10,
    emotional: 10
  };
  
  const reward = rewards[activityType] || 5;
  addCoins(reward);
  addCharacterExp(Math.floor(reward / 2));
  updateConsecutiveDays();
  
  // 퀘스트 진행도 업데이트
  if (activityType === 'symptom') {
    updateQuestProgress('symptom-record', 1, 1);
  }
}

export function updateQuestProgress(questId: string, progress: number, maxProgress: number): void {
  const gameData = getGameData();
  const today = new Date().toISOString().split('T')[0];
  
  // 일일 퀘스트 리셋 체크
  if (gameData.lastActivityDate !== today) {
    // 새로운 날이면 일일 퀘스트 진행도 리셋
    Object.keys(gameData.questProgress).forEach(key => {
      if (key.startsWith('daily-') || ['symptom-record', 'exercise-20min', 'medication', 'water-8glasses', 'meditation-10min'].includes(key)) {
        delete gameData.questProgress[key];
      }
    });
    gameData.lastActivityDate = today;
  }
  
  if (!gameData.questProgress[questId]) {
    gameData.questProgress[questId] = {
      completed: false,
      progress: 0,
      maxProgress
    };
  }
  
  gameData.questProgress[questId].progress = Math.min(progress, maxProgress);
  gameData.questProgress[questId].maxProgress = maxProgress;
  const wasCompleted = gameData.questProgress[questId].completed;
  gameData.questProgress[questId].completed = gameData.questProgress[questId].progress >= maxProgress;
  
    // 퀘스트 완료 시 자동으로 보상 지급
    if (!wasCompleted && gameData.questProgress[questId].completed) {
      const questRewards: Record<string, number> = {
        'symptom-record': 50,
        'exercise-20min': 40,
        'medication': 40,
        'water-8glasses': 40,
        'meditation-10min': 40
      };
    
    const reward = questRewards[questId] || 20;
    addCoins(reward);
    addCharacterExp(Math.floor(reward / 2));
    gameData.completedQuests += 1;
  }
  
  saveGameData(gameData);
}

