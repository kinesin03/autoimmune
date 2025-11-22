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

const TodayFlareIndexNew: React.FC<TodayFlareIndexProps> = ({ diagnosisData }) => {
  const [flareIndex, setFlareIndex] = useState<FlareIndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(getGameData());
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
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
      <div className="today-flare-index-new">
        <div className="loading-state">로딩 중...</div>
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

  const progressPercentage = Math.min(100, flareIndex.totalScore);

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
          <div className="character-image">
            <div 
              className="character-background"
              style={{
                background: customization.background ? 
                  (() => {
                    const bgItems: CharacterItem[] = [
                      { id: 'bg-1', name: '하늘 배경', category: 'background', price: 200, image: '☁️', backgroundGradient: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%)' },
                      { id: 'bg-2', name: '숲 배경', category: 'background', price: 200, image: '🌲', backgroundGradient: 'linear-gradient(135deg, #90EE90 0%, #228B22 100%)' },
                      { id: 'bg-3', name: '바다 배경', category: 'background', price: 250, image: '🌊', backgroundGradient: 'linear-gradient(135deg, #1E90FF 0%, #00CED1 100%)' },
                      { id: 'bg-4', name: '일몰 배경', category: 'background', price: 300, image: '🌅', backgroundGradient: 'linear-gradient(135deg, #FF6347 0%, #FFD700 100%)' },
                      { id: 'bg-5', name: '밤하늘 배경', category: 'background', price: 350, image: '🌙', backgroundGradient: 'linear-gradient(135deg, #191970 0%, #4B0082 100%)' },
                      { id: 'bg-6', name: '벚꽃 배경', category: 'background', price: 400, image: '🌸', backgroundGradient: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)' },
                    ];
                    const bgItem = bgItems.find(item => item.id === customization.background);
                    return bgItem?.backgroundGradient || 'transparent';
                  })() : 'transparent'
              }}
            />
            <div className="character-illustration">
              <svg width="100" height="100" viewBox="0 0 100 100" className="character-svg">
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="peachGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A3" />
                    <stop offset="100%" stopColor="#FFB380" />
                  </linearGradient>
                  {customization.outfit && (() => {
                    const outfitItems: Partial<CharacterItem>[] = [
                      { id: 'outfit-1', color: '#93c5fd', design: 'stripe' },
                      { id: 'outfit-2', color: '#fda4af', design: 'dot-dress' },
                      { id: 'outfit-3', color: '#6ee7b7', design: 'check' },
                      { id: 'outfit-4', color: '#c4b5fd', design: 'heart' },
                      { id: 'outfit-5', color: '#fcd34d', design: 'star' },
                      { id: 'outfit-6', color: '#f0abfc', design: 'flower-dress' },
                      { id: 'outfit-7', color: '#fef3c7', design: 'sweater' },
                      { id: 'outfit-8', color: '#ddd6fe', design: 'hoodie' },
                    ];
                    const outfit = outfitItems.find(item => item.id === customization.outfit);
                    if (!outfit) return null;
                    
                    // 기본 그라데이션
                    const gradient = (
                      <linearGradient id="outfitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={outfit.color} />
                        <stop offset="100%" stopColor={outfit.color + 'dd'} />
                      </linearGradient>
                    );
                    
                    // 패턴 정의
                    const patterns: { [key: string]: JSX.Element } = {
                      'stripe': (
                        <pattern id="stripePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke={outfit.color} strokeWidth="2" opacity="0.3" />
                          <line x1="4" y1="0" x2="4" y2="8" stroke={outfit.color} strokeWidth="1" opacity="0.2" />
                        </pattern>
                      ),
                      'dot': (
                        <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                          <circle cx="6" cy="6" r="1.5" fill={outfit.color} opacity="0.4" />
                        </pattern>
                      ),
                      'check': (
                        <pattern id="checkPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                          <rect x="0" y="0" width="5" height="5" fill={outfit.color} opacity="0.3" />
                          <rect x="5" y="5" width="5" height="5" fill={outfit.color} opacity="0.3" />
                        </pattern>
                      ),
                      'heart': (
                        <pattern id="heartPattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                          <path d="M 7.5 5 Q 7.5 3 5 3 Q 2.5 3 2.5 5 Q 2.5 7 5 9 Q 7.5 7 7.5 5" fill={outfit.color} opacity="0.3" />
                        </pattern>
                      ),
                      'star': (
                        <pattern id="starPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                          <path d="M 6 2 L 7 5 L 10 5 L 7.5 7 L 8.5 10 L 6 8 L 3.5 10 L 4.5 7 L 2 5 L 5 5 Z" fill={outfit.color} opacity="0.3" />
                        </pattern>
                      ),
                      'flower': (
                        <pattern id="flowerPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="8" cy="8" r="2" fill={outfit.color} opacity="0.3" />
                          <circle cx="4" cy="4" r="1" fill={outfit.color} opacity="0.2" />
                          <circle cx="12" cy="4" r="1" fill={outfit.color} opacity="0.2" />
                          <circle cx="4" cy="12" r="1" fill={outfit.color} opacity="0.2" />
                          <circle cx="12" cy="12" r="1" fill={outfit.color} opacity="0.2" />
                        </pattern>
                      ),
                    };
                    
                    return (
                      <>
                        {gradient}
                        {outfit.design && patterns[outfit.design]}
                      </>
                    );
                  })()}
                </defs>
                
                {/* Body */}
                <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#peachGradient)" />
                
                {/* 의상 - Body 위에 그리기 */}
                {customization.outfit && (() => {
                  const outfitItems: Partial<CharacterItem>[] = [
                    { id: 'outfit-1', design: 'stripe' }, { id: 'outfit-2', design: 'dot-dress' },
                    { id: 'outfit-3', design: 'check' }, { id: 'outfit-4', design: 'heart' },
                    { id: 'outfit-5', design: 'star' }, { id: 'outfit-6', design: 'flower-dress' },
                    { id: 'outfit-7', design: 'sweater' }, { id: 'outfit-8', design: 'hoodie' },
                  ];
                  const outfit = outfitItems.find(item => item.id === customization.outfit);
                  if (!outfit) return null;
                  
                  const patternId = outfit.design === 'dot-dress' ? 'dotPattern' :
                                   outfit.design === 'flower-dress' ? 'flowerPattern' :
                                   outfit.design + 'Pattern';
                  
                  // 원피스 스타일 (outfit-2, outfit-6)
                  if (outfit.design === 'dot-dress' || outfit.design === 'flower-dress') {
                    return (
                      <g>
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#outfitGradient)" opacity="0.9" />
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill={`url(#${patternId})`} opacity="0.6" />
                        {/* 원피스 스커트 부분 */}
                        <ellipse cx="50" cy="75" rx="14" ry="12" fill="url(#outfitGradient)" opacity="0.9" />
                        <ellipse cx="50" cy="75" rx="14" ry="12" fill={`url(#${patternId})`} opacity="0.6" />
                      </g>
                    );
                  }
                  
                  // 후드티 (outfit-8)
                  if (outfit.design === 'hoodie') {
                    return (
                      <g>
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#outfitGradient)" opacity="0.9" />
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill={`url(#${patternId})`} opacity="0.4" />
                        {/* 후드 */}
                        <path d="M 40 45 Q 50 40 60 45" stroke="#374151" strokeWidth="2" fill="none" />
                        <ellipse cx="50" cy="42" rx="8" ry="6" fill="#1f2937" opacity="0.3" />
                      </g>
                    );
                  }
                  
                  // 니트 스웨터 (outfit-7)
                  if (outfit.design === 'sweater') {
                    return (
                      <g>
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#outfitGradient)" opacity="0.9" />
                        {/* 니트 텍스처 */}
                        <path d="M 40 60 L 60 60 M 40 65 L 60 65 M 40 70 L 60 70" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
                        <path d="M 45 58 L 45 75 M 50 58 L 50 75 M 55 58 L 55 75" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
                      </g>
                    );
                  }
                  
                  // 일반 패턴 의상
                  return (
                    <g>
                      <ellipse cx="50" cy="68" rx="16" ry="18" fill="url(#outfitGradient)" opacity="0.9" />
                      {outfit.design && (
                        <ellipse cx="50" cy="68" rx="16" ry="18" fill={`url(#${patternId})`} opacity="0.5" />
                      )}
                    </g>
                  );
                })()}
                
                {/* Head - large rounded dome */}
                <circle cx="50" cy="32" r="26" fill="url(#peachGradient)" />
                
                {/* 모자/베레모/볼캡 */}
                {customization.accessory === 'acc-1' && (
                  <g>
                    <ellipse cx="50" cy="20" rx="22" ry="8" fill="#8b5cf6" />
                    <ellipse cx="50" cy="18" rx="20" ry="6" fill="#a78bfa" />
                  </g>
                )}
                {customization.accessory === 'acc-2' && (
                  <g>
                    <ellipse cx="50" cy="22" rx="24" ry="6" fill="#3b82f6" />
                    <rect x="30" y="22" width="40" height="3" fill="#2563eb" />
                  </g>
                )}
                
                {/* Ears */}
                <ellipse cx="24" cy="28" rx="4" ry="7" fill="url(#peachGradient)" />
                <ellipse cx="76" cy="28" rx="4" ry="7" fill="url(#peachGradient)" />
                
                {/* Eyes - small vertical ovals */}
                <ellipse cx="45" cy="30" rx="2.5" ry="3.5" fill="#000" />
                <ellipse cx="55" cy="30" rx="2.5" ry="3.5" fill="#000" />
                
                {/* 선글라스 */}
                {customization.accessory === 'acc-3' && (
                  <g>
                    <ellipse cx="45" cy="30" rx="6" ry="4" fill="#1f2937" opacity="0.8" />
                    <ellipse cx="55" cy="30" rx="6" ry="4" fill="#1f2937" opacity="0.8" />
                    <line x1="51" y1="30" x2="49" y2="30" stroke="#374151" strokeWidth="1" />
                  </g>
                )}
                
                {/* Cheeks - rosy pink circles */}
                <circle cx="37" cy="36" r="3.5" fill="#FFB3B3" opacity="0.7" />
                <circle cx="63" cy="36" r="3.5" fill="#FFB3B3" opacity="0.7" />
                
                {/* Antenna - curved black line */}
                <path d="M 50 6 Q 52 2 58 4" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
                
                {/* Star - light blue five-pointed star */}
                <g transform="translate(58, 4)">
                  <path d="M 0,-6 L 1.5,-1.5 L 6,-1.5 L 2.25,0.75 L 3.75,5.25 L 0,3 L -3.75,5.25 L -2.25,0.75 L -6,-1.5 L -1.5,-1.5 Z" fill="#87CEEB" />
                </g>
                
                {/* 리본 헤어핀 */}
                {customization.accessory === 'acc-7' && (
                  <g transform="translate(50, 15)">
                    <path d="M -4,-2 L 0,2 L 4,-2 L 0,-4 Z" fill="#ec4899" />
                    <circle cx="0" cy="-2" r="1.5" fill="#fda4af" />
                  </g>
                )}
                
                {/* 귀걸이 */}
                {customization.accessory === 'acc-4' && (
                  <g>
                    <path d="M 20 30 L 20 35 L 18 35 L 18 30 Z" fill="#fbbf24" />
                    <circle cx="19" cy="32" r="1.5" fill="#fcd34d" />
                    <path d="M 80 30 L 80 35 L 82 35 L 82 30 Z" fill="#fbbf24" />
                    <circle cx="81" cy="32" r="1.5" fill="#fcd34d" />
                  </g>
                )}
                {customization.accessory === 'acc-8' && (
                  <g>
                    <circle cx="20" cy="32" r="2" fill="#e0e7ff" />
                    <circle cx="20" cy="32" r="1" fill="#ffffff" />
                    <circle cx="80" cy="32" r="2" fill="#e0e7ff" />
                    <circle cx="80" cy="32" r="1" fill="#ffffff" />
                  </g>
                )}
                
                {/* 목걸이 */}
                {customization.accessory === 'acc-5' && (
                  <g>
                    <path d="M 40 42 Q 50 48 60 42" stroke="#fda4af" strokeWidth="2" fill="none" />
                    <path d="M 48 46 Q 50 50 52 46" fill="#ec4899" />
                  </g>
                )}
                
                {/* Right arm (raised/waving) */}
                <ellipse cx="66" cy="48" rx="3.5" ry="10" fill="url(#peachGradient)" transform="rotate(-25 66 48)" />
                {/* 의상 - Right arm */}
                {customization.outfit && (() => {
                  const outfitItems: Partial<CharacterItem>[] = [
                    { id: 'outfit-1', design: 'stripe' }, { id: 'outfit-2', design: 'dot-dress' },
                    { id: 'outfit-3', design: 'check' }, { id: 'outfit-4', design: 'heart' },
                    { id: 'outfit-5', design: 'star' }, { id: 'outfit-6', design: 'flower-dress' },
                    { id: 'outfit-7', design: 'sweater' }, { id: 'outfit-8', design: 'hoodie' },
                  ];
                  const outfit = outfitItems.find(item => item.id === customization.outfit);
                  if (!outfit) return null;
                  
                  const patternId = outfit.design === 'dot-dress' ? 'dotPattern' :
                                   outfit.design === 'flower-dress' ? 'flowerPattern' :
                                   outfit.design + 'Pattern';
                  
                  return (
                    <g transform="rotate(-25 66 48)">
                      <ellipse cx="66" cy="48" rx="3.5" ry="10" fill="url(#outfitGradient)" opacity="0.9" />
                      {outfit.design && outfit.design !== 'sweater' && outfit.design !== 'hoodie' && (
                        <ellipse cx="66" cy="48" rx="3.5" ry="10" fill={`url(#${patternId})`} opacity="0.5" />
                      )}
                    </g>
                  );
                })()}
                
                {/* 시계 */}
                {customization.accessory === 'acc-6' && (
                  <g transform="translate(66, 48) rotate(-25)">
                    <circle cx="0" cy="0" r="4" fill="#fbbf24" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <line x1="0" y1="0" x2="0" y2="-2" stroke="#1f2937" strokeWidth="1" />
                    <line x1="0" y1="0" x2="2" y2="0" stroke="#1f2937" strokeWidth="1" />
                  </g>
                )}
                
                {/* Left arm (bent) */}
                <ellipse cx="34" cy="60" rx="3.5" ry="10" fill="url(#peachGradient)" transform="rotate(25 34 60)" />
                {/* 의상 - Left arm */}
                {customization.outfit && (() => {
                  const outfitItems: Partial<CharacterItem>[] = [
                    { id: 'outfit-1', design: 'stripe' }, { id: 'outfit-2', design: 'dot-dress' },
                    { id: 'outfit-3', design: 'check' }, { id: 'outfit-4', design: 'heart' },
                    { id: 'outfit-5', design: 'star' }, { id: 'outfit-6', design: 'flower-dress' },
                    { id: 'outfit-7', design: 'sweater' }, { id: 'outfit-8', design: 'hoodie' },
                  ];
                  const outfit = outfitItems.find(item => item.id === customization.outfit);
                  if (!outfit) return null;
                  
                  const patternId = outfit.design === 'dot-dress' ? 'dotPattern' :
                                   outfit.design === 'flower-dress' ? 'flowerPattern' :
                                   outfit.design + 'Pattern';
                  
                  return (
                    <g transform="rotate(25 34 60)">
                      <ellipse cx="34" cy="60" rx="3.5" ry="10" fill="url(#outfitGradient)" opacity="0.9" />
                      {outfit.design && outfit.design !== 'sweater' && outfit.design !== 'hoodie' && (
                        <ellipse cx="34" cy="60" rx="3.5" ry="10" fill={`url(#${patternId})`} opacity="0.5" />
                      )}
                    </g>
                  );
                })()}
                
                {/* Legs/Feet */}
                <ellipse cx="42" cy="85" rx="4.5" ry="7" fill="url(#peachGradient)" />
                <ellipse cx="58" cy="85" rx="4.5" ry="7" fill="url(#peachGradient)" />
              </svg>
            </div>
          </div>
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

