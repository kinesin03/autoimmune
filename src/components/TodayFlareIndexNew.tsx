import React, { useState, useEffect } from 'react';
import { DiagnosisData, FlareManagementData, CharacterCustomization, CharacterItem } from '../types';
import { predictFlareFromProdromalSymptoms } from '../utils/prodromalFlarePrediction';
import { analyzeFlareRisk, analyzeStressCorrelation, analyzeFoodCorrelation, analyzeSleepCorrelation } from '../utils/flareAnalysis';
import { analyzeEnvironmentalRisk } from '../utils/environmentalRiskAnalysis';
import { fetchEnvironmentalData } from '../utils/weather/environmentalDataFetcher';
import { Zap, Shield, HelpCircle, ShoppingBag, ShoppingCart } from 'lucide-react';
import { getGameData, updateConsecutiveDays, completeQuest } from '../utils/gameSystem';
import QuestModal from './QuestModal';
import CharacterShopModal from './CharacterShopModal';
import './TodayFlareIndexNew.css';

interface TodayFlareIndexProps {
  diagnosisData: DiagnosisData;
}

interface FlareIndexData {
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  message: string;
  factors: {
    symptoms: number;
    environment: number;
    lifestyle: number;
  };
  recommendations: string[];
}

const DEFAULT_CHARACTER_VIDEO = '/character-video.mp4';

const TodayFlareIndexNew: React.FC<TodayFlareIndexProps> = ({ diagnosisData }) => {
  const [flareIndex, setFlareIndex] = useState<FlareIndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(getGameData());
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [characterVideo, setCharacterVideo] = useState<string | null>(() => {
    const saved = localStorage.getItem('characterVideo');
    if (saved) {
      return saved;
    }
    return DEFAULT_CHARACTER_VIDEO;
  });
  const [customization, setCustomization] = useState<CharacterCustomization>(() => {
    const saved = localStorage.getItem('characterCustomization');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load customization:', e);
      }
    }
    return { ownedItems: [] };
  });

  // localStorage 변경사항 감지하여 customization 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('characterCustomization');
      if (saved) {
        try {
          setCustomization(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load customization:', e);
        }
      }
    };

    // 초기 로드
    handleStorageChange();

    // storage 이벤트 리스너 추가 (다른 탭에서 변경된 경우)
    window.addEventListener('storage', handleStorageChange);

    // 주기적으로 확인 (같은 탭에서 변경된 경우)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 상점 아이템 목록 (CharacterShopModal과 동일)
  const shopItems: CharacterItem[] = [
    // 악세서리
    { id: 'acc-1', name: '베레모', category: 'accessory', price: 200, image: '🎩', description: '세련된 베레모' },
    { id: 'acc-2', name: '볼캡', category: 'accessory', price: 180, image: '🧢', description: '캐주얼 볼캡' },
    { id: 'acc-3', name: '선글라스', category: 'accessory', price: 250, image: '🕶️', description: '스타일리시한 선글라스' },
    { id: 'acc-4', name: '별 헤어핀', category: 'accessory', price: 220, image: '⭐', description: '반짝이는 별 헤어핀' },
    { id: 'acc-5', name: '하트 헤어핀', category: 'accessory', price: 280, image: '💖', description: '사랑스러운 하트 헤어핀' },
    { id: 'acc-7', name: '리본 헤어핀', category: 'accessory', price: 200, image: '🎀', description: '귀여운 리본 헤어핀' },
    // 소품
    { id: 'prop-1', name: '물고기', category: 'prop', price: 150, image: '🐟', description: '귀여운 물고기' },
    { id: 'prop-2', name: '선인장', category: 'prop', price: 180, image: '🌵', description: '귀여운 선인장' },
    { id: 'prop-3', name: '선물상자', category: 'prop', price: 200, image: '🎁', description: '반짝이는 선물상자' },
    { id: 'prop-4', name: '별풍선', category: 'prop', price: 220, image: '⭐', description: '하늘로 날아가는 별풍선' },
    { id: 'prop-5', name: '케이크', category: 'prop', price: 250, image: '🎂', description: '달콤한 케이크' },
    { id: 'prop-6', name: '책', category: 'prop', price: 180, image: '📚', description: '지식을 담은 책' },
  ];
  const [todayQuests, setTodayQuests] = useState([
    { id: 'symptom-record', text: '증상 기록하기', description: '오늘의 증상을 기록하세요', reward: 50 },
    { id: 'exercise-20min', text: '운동 20분', description: '가벼운 운동을 20분 하세요', reward: 40 },
    { id: 'medication', text: '약물 복용', description: '처방된 약을 복용하세요', reward: 40 },
    { id: 'water-8glasses', text: '수분 섭취 8잔', description: '물을 8잔 마시세요', reward: 40 },
    { id: 'meditation-10min', text: '명상 10분', description: '마음을 편안하게 하세요', reward: 40 }
  ]);

  useEffect(() => {
    const calculateFlareIndex = async () => {
      setLoading(true);
      try {
        const symptomPrediction = predictFlareFromProdromalSymptoms(
          diagnosisData.commonSymptoms,
          diagnosisData.diseaseSpecific
        );

        const today = new Date().toISOString().split('T')[0];
        const environmentalData = await fetchEnvironmentalData(today);
        const environmentalRisk = analyzeEnvironmentalRisk([environmentalData]);

        let lifestyleRisk: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical'; factors: { stress: boolean; food: boolean; sleep: boolean }; message: string; recommendations: string[] } = { 
          riskScore: 0, 
          riskLevel: 'low', 
          factors: { stress: false, food: false, sleep: false }, 
          message: '', 
          recommendations: [] 
        };
        try {
          const saved = localStorage.getItem('flareManagementData');
          if (saved) {
            const flareData: FlareManagementData = JSON.parse(saved);
            if (flareData.flares.length > 0 || flareData.stressRecords.length > 0 || 
                flareData.foodRecords.length > 0 || flareData.sleepRecords.length > 0) {
              const stressCorrelation = analyzeStressCorrelation(flareData.flares, flareData.stressRecords);
              const foodCorrelations = analyzeFoodCorrelation(flareData.flares, flareData.foodRecords);
              const sleepCorrelation = analyzeSleepCorrelation(flareData.flares, flareData.sleepRecords);
              
              lifestyleRisk = analyzeFlareRisk({
                ...flareData,
                stressCorrelation,
                foodCorrelations,
                sleepCorrelation
              });
            }
          }
        } catch (e) {
          console.error('Flare 유발 요인 데이터 로드 실패:', e);
        }

        const symptomWeight = 0.4;
        const environmentWeight = 0.3;
        const lifestyleWeight = 0.3;

        const symptomScore = symptomPrediction.totalScore;
        const environmentScore = environmentalRisk.riskScore;
        const lifestyleScore = lifestyleRisk.riskScore;

        const totalScore = Math.min(100, 
          symptomScore * symptomWeight + 
          environmentScore * environmentWeight + 
          lifestyleScore * lifestyleWeight
        );

        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        let probability: number;

        if (totalScore >= 70) {
          riskLevel = 'critical';
          probability = 80;
        } else if (totalScore >= 50) {
          riskLevel = 'high';
          probability = 60;
        } else if (totalScore >= 30) {
          riskLevel = 'medium';
          probability = 40;
        } else {
          riskLevel = 'low';
          probability = 20;
        }

        const message = riskLevel === 'low' 
          ? '현재 상태가 안정적입니다'
          : riskLevel === 'medium'
          ? '주의가 필요합니다'
          : riskLevel === 'high'
          ? '주의 깊게 관찰하세요'
          : '즉시 전문의와 상담하세요';

        setFlareIndex({
          totalScore,
          riskLevel,
          probability,
          message,
          factors: {
            symptoms: symptomScore,
            environment: environmentScore,
            lifestyle: lifestyleScore
          },
          recommendations: [
            ...(environmentalRisk.recommendations || []),
            ...(lifestyleRisk.recommendations || [])
          ]
        });
      } catch (error) {
        console.error('Flare 지수 계산 오류:', error);
        // 에러 발생 시에도 기본값 설정
        setFlareIndex({
          totalScore: 0,
          riskLevel: 'low',
          probability: 20,
          message: '현재 상태가 안정적입니다',
          factors: {
            symptoms: 0,
            environment: 0,
            lifestyle: 0
          },
          recommendations: []
        });
      } finally {
        setLoading(false);
      }
    };

    calculateFlareIndex();
    
    // 게임 데이터 업데이트
    const updatedGameData = getGameData();
    updateConsecutiveDays();
    setGameData(updatedGameData);
  }, [diagnosisData]);

  useEffect(() => {
    // 주기적으로 게임 데이터 새로고침
    const interval = setInterval(() => {
      setGameData(getGameData());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 커스터마이징 데이터 로드
    const saved = localStorage.getItem('characterCustomization');
    if (saved) {
      try {
        setCustomization(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load customization:', e);
      }
    }
  }, [showShopModal]);

  const handleShopPurchase = () => {
    setGameData(getGameData());
    const saved = localStorage.getItem('characterCustomization');
    if (saved) {
      try {
        setCustomization(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load customization:', e);
      }
    }
  };

  const handleQuestComplete = (coins: number, exp: number) => {
    setGameData(getGameData());
  };

  const handleQuestClick = (questId: string, reward: number) => {
    const status = getQuestStatus(questId);
    if (!status.completed) {
      completeQuest(questId, reward);
      setGameData(getGameData());
    }
  };

  if (loading || !flareIndex) {
    return (
      <div className="today-flare-index-new" style={{ padding: '20px', minHeight: '200px' }}>
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  const riskLevelText = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    critical: '매우 높음'
  };

  const riskLevelClass = {
    low: 'tag-low',
    medium: 'tag-medium',
    high: 'tag-high',
    critical: 'tag-high'
  };

  const progressPercentage = 29.5; // 고정값 29.5%

  const getQuestStatus = (questId: string) => {
    return gameData.questProgress[questId] || {
      completed: false,
      progress: 0,
      maxProgress: 1
    };
  };

  return (
    <div className="today-flare-index-new">
      {/* 퀘스트 버튼 */}
      <button 
        className="quest-button"
        onClick={() => setShowQuestModal(true)}
        title="퀘스트 확인"
      >
        <HelpCircle size={24} />
      </button>

      {/* Flare-up 위험도 카드 */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">
            <Shield size={18} className="shield-icon" />
            Flare-up 위험도
          </h3>
          <span className={`card-tag ${riskLevelClass[flareIndex.riskLevel]}`}>
            {riskLevelText[flareIndex.riskLevel]}
          </span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="progress-text">{flareIndex.message}</p>
      </div>

      {/* 나의 캐릭터 카드 */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="star-icon">⭐</span>
            나의 캐릭터
          </h3>
          <div className="card-header-right">
            <span className="card-tag tag-purple">Lv.{gameData.characterLevel}</span>
            <button 
              className="shop-button"
              onClick={() => setShowShopModal(true)}
              title="상점 열기"
            >
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>
        <div className="character-section">
          <div className="character-image-wrapper">
            <div className="character-image">
              <div className="character-illustration">
              {characterVideo && characterVideo !== DEFAULT_CHARACTER_VIDEO ? (
                <>
                  {/* 비디오 캐릭터의 헤어핀 오버레이 (머리 위) */}
                  {(customization.accessory === 'acc-1' || customization.accessory === 'acc-2' || customization.accessory === 'acc-4' || customization.accessory === 'acc-5' || customization.accessory === 'acc-7') && (() => {
                    const accessory = shopItems.find(item => item.id === customization.accessory);
                    return accessory ? (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: accessory.id === 'acc-1' || accessory.id === 'acc-2' ? '28px' : '25px',
                          zIndex: 10,
                          pointerEvents: 'none'
                        }}
                      >
                        {accessory.image}
                      </div>
                    ) : null;
                  })()}
                  {/* 비디오 캐릭터의 선글라스 오버레이 (눈을 가리도록) */}
                  {customization.accessory === 'acc-3' && (() => {
                    const accessory = shopItems.find(item => item.id === 'acc-3');
                    return accessory ? (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '30%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '40px',
                          zIndex: 15,
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        }}
                      >
                        {accessory.image}
                      </div>
                    ) : null;
                  })()}
                  <video
                    src={characterVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="character-video"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                </>
              ) : characterVideo === DEFAULT_CHARACTER_VIDEO ? (
                <>
                  {/* 비디오 캐릭터의 헤어핀 오버레이 (머리 위) */}
                  {(customization.accessory === 'acc-1' || customization.accessory === 'acc-2' || customization.accessory === 'acc-4' || customization.accessory === 'acc-5' || customization.accessory === 'acc-7') && (() => {
                    const accessory = shopItems.find(item => item.id === customization.accessory);
                    return accessory ? (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: accessory.id === 'acc-1' || accessory.id === 'acc-2' ? '28px' : '25px',
                          zIndex: 10,
                          pointerEvents: 'none'
                        }}
                      >
                        {accessory.image}
                      </div>
                    ) : null;
                  })()}
                  {/* 비디오 캐릭터의 선글라스 오버레이 (눈을 가리도록) */}
                  {customization.accessory === 'acc-3' && (() => {
                    const accessory = shopItems.find(item => item.id === 'acc-3');
                    return accessory ? (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '30%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '40px',
                          zIndex: 15,
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        }}
                      >
                        {accessory.image}
                      </div>
                    ) : null;
                  })()}
                  <video
                    src={DEFAULT_CHARACTER_VIDEO}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="character-video"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                    onError={() => {
                      setCharacterVideo(null);
                    }}
                  />
                </>
              ) : (
                <svg width="120" height="120" viewBox="0 0 100 100" className="character-svg">
                  {/* Gradient definitions */}
                  <defs>
                  <linearGradient id="peachGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A3" />
                    <stop offset="100%" stopColor="#FFB380" />
                  </linearGradient>
                </defs>
                
                {/* Body */}
                <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#peachGradient)" />
                
                {/* Head - large rounded dome */}
                <circle cx="50" cy="32" r="26" fill="url(#peachGradient)" />
                
                {/* 베레모, 볼캡은 별 부분에 표시하지 않음 (모자이므로 별 위에 표시) */}
                
                {/* Ears */}
                <ellipse cx="24" cy="28" rx="4" ry="7" fill="url(#peachGradient)" />
                <ellipse cx="76" cy="28" rx="4" ry="7" fill="url(#peachGradient)" />
                
                {/* Eyes - small vertical ovals */}
                <ellipse cx="45" cy="30" rx="2.5" ry="3.5" fill="#000" />
                <ellipse cx="55" cy="30" rx="2.5" ry="3.5" fill="#000" />
                
                {/* 선글라스 - 눈을 가리도록 눈 위에 표시 */}
                {customization.accessory === 'acc-3' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-3');
                  return accessory ? (
                    <g>
                      {/* 선글라스 렌즈 부분으로 눈 가리기 */}
                      <ellipse cx="45" cy="30" rx="6" ry="4" fill="#1a1a1a" opacity="0.3" />
                      <ellipse cx="55" cy="30" rx="6" ry="4" fill="#1a1a1a" opacity="0.3" />
                      {/* 선글라스 프레임 */}
                      <foreignObject x="30" y="18" width="40" height="20">
                        <div style={{ fontSize: '40px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                      </foreignObject>
                    </g>
                  ) : null;
                })()}
                
                {/* Cheeks - rosy pink circles */}
                <circle cx="37" cy="36" r="3.5" fill="#FFB3B3" opacity="0.7" />
                <circle cx="63" cy="36" r="3.5" fill="#FFB3B3" opacity="0.7" />
                
                {/* Antenna - curved black line */}
                <path d="M 50 6 Q 52 2 58 4" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
                
                {/* Star - light blue five-pointed star */}
                <g transform="translate(58, 4)">
                  <path d="M 0,-6 L 1.5,-1.5 L 6,-1.5 L 2.25,0.75 L 3.75,5.25 L 0,3 L -3.75,5.25 L -2.25,0.75 L -6,-1.5 L -1.5,-1.5 Z" fill="#87CEEB" />
                </g>
                
                {/* 헤어핀들 - 캐릭터 머리 위에 표시 */}
                {customization.accessory === 'acc-1' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-1');
                  return accessory ? (
                    <foreignObject x="30" y="5" width="40" height="30">
                      <div style={{ fontSize: '28px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                    </foreignObject>
                  ) : null;
                })()}
                {customization.accessory === 'acc-2' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-2');
                  return accessory ? (
                    <foreignObject x="30" y="5" width="40" height="30">
                      <div style={{ fontSize: '28px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                    </foreignObject>
                  ) : null;
                })()}
                {customization.accessory === 'acc-4' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-4');
                  return accessory ? (
                    <foreignObject x="35" y="8" width="30" height="25">
                      <div style={{ fontSize: '25px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                    </foreignObject>
                  ) : null;
                })()}
                {customization.accessory === 'acc-5' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-5');
                  return accessory ? (
                    <foreignObject x="35" y="8" width="30" height="25">
                      <div style={{ fontSize: '25px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                    </foreignObject>
                  ) : null;
                })()}
                {customization.accessory === 'acc-7' && (() => {
                  const accessory = shopItems.find(item => item.id === 'acc-7');
                  return accessory ? (
                    <foreignObject x="35" y="8" width="30" height="25">
                      <div style={{ fontSize: '25px', textAlign: 'center', lineHeight: 1 }}>{accessory.image}</div>
                    </foreignObject>
                  ) : null;
                })()}
                
                {/* Right arm (raised/waving) */}
                <ellipse cx="66" cy="48" rx="3.5" ry="10" fill="url(#peachGradient)" transform="rotate(-25 66 48)" />
                
                {/* Left arm (bent) */}
                <ellipse cx="34" cy="60" rx="3.5" ry="10" fill="url(#peachGradient)" transform="rotate(25 34 60)" />
                
                {/* Legs/Feet */}
                <ellipse cx="42" cy="85" rx="4.5" ry="7" fill="url(#peachGradient)" />
                <ellipse cx="58" cy="85" rx="4.5" ry="7" fill="url(#peachGradient)" />
              </svg>
              )}
            </div>
            </div>
          </div>
          {/* 소품 표시 */}
          {customization.prop && (() => {
            const propItem = shopItems.find(item => item.id === customization.prop);
            return propItem ? (
              <div 
                className="character-prop"
                style={{
                  position: 'absolute',
                  left: '-40px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '40px',
                  zIndex: 5,
                  animation: 'float 3s ease-in-out infinite'
                }}
              >
                {propItem.image}
              </div>
            ) : null;
          })()}
          <div className="character-info">
            <div className="exp-section">
              <span className="exp-label">⭐ 경험치</span>
              <span className="exp-value">{gameData.characterExp}/{gameData.characterExpMax}</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(gameData.characterExp / gameData.characterExpMax) * 100}%` }}
              />
            </div>
            <div className="character-stats">
              <div className="stat-item">
                <div className="stat-label">연속 기록</div>
                <div className="stat-value">{gameData.consecutiveDays}일</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">완료 퀘스트</div>
                <div className="stat-value">{gameData.completedQuests}개</div>
              </div>
            </div>
            <p className="encouragement-text">조금만 더 힘내봐요! 💪</p>
          </div>
        </div>
      </div>

      {/* 오늘의 퀘스트 카드 */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">
            <Zap size={18} />
            오늘의 퀘스트
          </h3>
          <span className="card-tag tag-purple">
            {todayQuests.filter(q => getQuestStatus(q.id).completed).length}/{todayQuests.length} 완료
          </span>
        </div>
        <div className="quest-list">
          {todayQuests.map(quest => {
            const status = getQuestStatus(quest.id);
            return (
              <div 
                key={quest.id} 
                className={`quest-item ${status.completed ? 'completed' : ''}`}
                onClick={() => handleQuestClick(quest.id, quest.reward)}
                style={{ cursor: status.completed ? 'default' : 'pointer' }}
              >
                {status.completed ? (
                  <span className="quest-check">✓</span>
                ) : (
                  <span className="quest-check incomplete">○</span>
                )}
                <div className="quest-text-wrapper">
                  <span className="quest-text">{quest.text}</span>
                  {quest.description && (
                    <span className="quest-description">{quest.description}</span>
                  )}
                </div>
                <span className="quest-reward">🪙 +{quest.reward}</span>
              </div>
            );
          })}
        </div>
      </div>

      <QuestModal
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
        onQuestComplete={handleQuestComplete}
      />

      <CharacterShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        onPurchase={handleShopPurchase}
      />
    </div>
  );
};

export default TodayFlareIndexNew;

