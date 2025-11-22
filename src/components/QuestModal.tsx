import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle } from 'lucide-react';
import { getGameData, completeQuest, updateQuestProgress } from '../utils/gameSystem';
import './QuestModal.css';

interface Quest {
  id: string;
  text: string;
  description?: string;
  reward: number;
  type: 'daily' | 'weekly';
}

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestComplete: (coins: number, exp: number) => void;
}

const QuestModal: React.FC<QuestModalProps> = ({ isOpen, onClose, onQuestComplete }) => {
  const [gameData, setGameData] = useState(getGameData());
  const [showReward, setShowReward] = useState<{ coins: number; exp: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGameData(getGameData());
    }
  }, [isOpen]);

  const dailyQuests: Quest[] = [
    { id: 'symptom-record', text: '증상 기록하기', description: '오늘의 증상을 기록하세요', reward: 50, type: 'daily' },
    { id: 'exercise-20min', text: '운동 20분', description: '가벼운 운동을 20분 하세요', reward: 40, type: 'daily' },
    { id: 'medication', text: '약물 복용', description: '처방된 약을 복용하세요', reward: 40, type: 'daily' },
    { id: 'water-8glasses', text: '수분 섭취 8잔', description: '물을 8잔 마시세요', reward: 40, type: 'daily' },
    { id: 'meditation-10min', text: '명상 10분', description: '마음을 편안하게 하세요', reward: 40, type: 'daily' }
  ];

  const handleQuestClick = (quest: Quest) => {
    if (!gameData.questProgress[quest.id]?.completed) {
      const result = completeQuest(quest.id, quest.reward);
      setGameData(getGameData());
      setShowReward({ coins: result.coins, exp: result.exp });
      onQuestComplete(result.coins, result.exp);
      
      setTimeout(() => {
        setShowReward(null);
      }, 2000);
    }
  };

  const getQuestStatus = (questId: string) => {
    return gameData.questProgress[questId] || {
      completed: false,
      progress: 0,
      maxProgress: 1
    };
  };

  if (!isOpen) return null;

  return (
    <div className="quest-modal-overlay" onClick={onClose}>
      <div className="quest-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quest-modal-header">
          <h2>오늘의 퀘스트</h2>
          <button className="quest-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="quest-modal-content">
          <div className="quest-stats">
            <div className="quest-stat-item">
              <span className="stat-label">완료</span>
              <span className="stat-value">
                {dailyQuests.filter(q => getQuestStatus(q.id).completed).length}/{dailyQuests.length}
              </span>
            </div>
            <div className="quest-stat-item">
              <span className="stat-label">보상</span>
              <span className="stat-value">🪙 {gameData.coins}</span>
            </div>
          </div>

          <div className="quest-list-modal">
            {dailyQuests.map(quest => {
              const status = getQuestStatus(quest.id);
              const isCompleted = status.completed;
              
              return (
                <div
                  key={quest.id}
                  className={`quest-item-modal ${isCompleted ? 'completed' : ''}`}
                  onClick={() => !isCompleted && handleQuestClick(quest)}
                >
                  <div className="quest-icon">
                    {isCompleted ? (
                      <CheckCircle size={24} className="quest-check-icon" />
                    ) : (
                      <Circle size={24} className="quest-circle-icon" />
                    )}
                  </div>
                  <div className="quest-info">
                    <div className="quest-text-modal">{quest.text}</div>
                    {quest.description && (
                      <div className="quest-description-modal">{quest.description}</div>
                    )}
                    <div className="quest-progress">
                      {status.progress}/{status.maxProgress}
                    </div>
                  </div>
                  <div className="quest-reward-modal">
                    <span className="reward-icon">🪙</span>
                    <span className="reward-amount">+{quest.reward}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {showReward && (
            <div className="reward-popup">
              <div className="reward-content">
                <div className="reward-item">🪙 +{showReward.coins - gameData.coins}</div>
                <div className="reward-item">⭐ +{showReward.exp - gameData.characterExp}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestModal;

