import React, { useState, useEffect } from 'react';
import { EmotionRecord, FlareRecord, EmotionFlareCorrelation, StressReliefRoutine, CommunityPost } from '../types';
import { analyzeEmotionFlareCorrelation } from '../utils/emotionAnalysis';
import './EmotionalCare.css';

const EmotionalCare: React.FC = () => {
  const [emotionRecords, setEmotionRecords] = useState<EmotionRecord[]>([]);
  const [correlation, setCorrelation] = useState<EmotionFlareCorrelation | null>(null);
  const [activeSection, setActiveSection] = useState<'graph' | 'routines' | 'community'>('graph');
  const [activeRoutine, setActiveRoutine] = useState<StressReliefRoutine | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // 스트레스 완화 루틴 데이터
  const stressReliefRoutines: StressReliefRoutine[] = [
    {
      id: '1',
      name: '심호흡 명상',
      description: '5분간 심호흡으로 스트레스 완화',
      duration: 5,
      category: 'breathing',
      steps: [
        '편안한 자세로 앉기',
        '4초간 코로 숨 들이쉬기',
        '4초간 숨 참기',
        '6초간 입으로 숨 내쉬기',
        '10회 반복'
      ]
    },
    {
      id: '2',
      name: '근육 이완법',
      description: '전신 근육 긴장과 이완 반복',
      duration: 10,
      category: 'exercise',
      steps: [
        '편안한 자세로 누우기',
        '발가락부터 머리까지 각 부위 5초간 긴장',
        '5초간 이완',
        '전신 부위 반복'
      ]
    },
    {
      id: '3',
      name: '마음챙김 명상',
      description: '현재 순간에 집중하는 명상',
      duration: 10,
      category: 'meditation',
      steps: [
        '조용한 장소 선택',
        '눈 감고 호흡에 집중',
        '생각이 떠오르면 관찰만 하기',
        '다시 호흡으로 돌아오기'
      ]
    }
  ];

  // 커뮤니티 게시글 예시
  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      author: '환자A',
      date: '2024-01-15',
      title: 'Flare 대응 경험 공유',
      content: '스트레스 관리가 정말 중요하다는 것을 깨달았습니다...',
      category: 'flare-management',
      likes: 15,
      comments: 5,
      tags: ['스트레스', '관리']
    },
    {
      id: '2',
      author: '환자B',
      date: '2024-01-14',
      title: '우울감 극복하기',
      content: '같은 질환을 가진 분들과 대화하는 것이 큰 도움이 됩니다...',
      category: 'emotional-support',
      likes: 23,
      comments: 8,
      tags: ['우울', '지지']
    }
  ];

  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('emotionRecords');
      if (saved) {
        try {
          const records = JSON.parse(saved);
          setEmotionRecords(records);
        } catch (e) {
          console.error('Failed to load emotion records:', e);
        }
      }

      const flares: FlareRecord[] = JSON.parse(
        localStorage.getItem('flareManagementData') || '{}'
      ).flares || [];

      if (emotionRecords.length > 0) {
        const corr = analyzeEmotionFlareCorrelation(emotionRecords, flares);
        setCorrelation(corr);
      }
    };

    loadData();
  }, [emotionRecords.length]);

  const handleAddEmotion = () => {
    const newRecord: EmotionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      emotions: {
        depression: 5,
        anxiety: 5,
        stress: 5,
        isolation: 5
      }
    };
    const updated = [...emotionRecords, newRecord];
    setEmotionRecords(updated);
    localStorage.setItem('emotionRecords', JSON.stringify(updated));
  };

  const handleStartRoutine = (routine: StressReliefRoutine) => {
    setActiveRoutine(routine);
    setCurrentStep(0);
    setTimer(0);
    setIsRunning(false);
  };

  const handleCloseRoutine = () => {
    setActiveRoutine(null);
    setCurrentStep(0);
    setTimer(0);
    setIsRunning(false);
  };

  const handleNextStep = () => {
    if (activeRoutine && currentStep < activeRoutine.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimer(0);
      setIsRunning(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimer(0);
      setIsRunning(false);
    }
  };

  const handleStartTimer = () => {
    setIsRunning(true);
  };

  const handleStopTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setTimer(0);
    setIsRunning(false);
  };

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // 타이머 포맷팅 (초를 분:초로)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="emotional-care">
      <div className="care-header">
        <h2>심리 케어</h2>
        <div className="care-tabs">
          <button
            className={activeSection === 'graph' ? 'active' : ''}
            onClick={() => setActiveSection('graph')}
          >
            감정 그래프
          </button>
          <button
            className={activeSection === 'routines' ? 'active' : ''}
            onClick={() => setActiveSection('routines')}
          >
            스트레스 완화 루틴
          </button>
          <button
            className={activeSection === 'community' ? 'active' : ''}
            onClick={() => setActiveSection('community')}
          >
            커뮤니티
          </button>
        </div>
      </div>

      {activeSection === 'graph' && (
        <div className="emotion-graph-section">
          <div className="graph-header">
            <h3>일주일간 감정 그래프와 Flare 상관 그래프</h3>
            <button className="btn btn-primary" onClick={handleAddEmotion}>
              감정 기록 추가
            </button>
          </div>

          {correlation && (
            <div className="correlation-analysis">
              <div className="correlation-message">
                {correlation.message.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="correlation-value">
                상관계수: {correlation.correlation.toFixed(2)}
              </div>
            </div>
          )}

          <div className="graph-container">
            <div className="graph-placeholder">
              <p>감정 점수와 Flare 발생 그래프</p>
              <p className="graph-note">차트 라이브러리 연동 필요 (Chart.js, Recharts 등)</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'routines' && (
        <div className="routines-section">
          <h3>스트레스 완화 루틴</h3>
          <div className="routines-grid">
            {stressReliefRoutines.map(routine => (
              <div key={routine.id} className="routine-card">
                <div className="routine-header">
                  <h4>{routine.name}</h4>
                  <span className="routine-duration">{routine.duration}분</span>
                </div>
                <p className="routine-description">{routine.description}</p>
                <div className="routine-steps">
                  <h5>단계:</h5>
                  <ol>
                    {routine.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStartRoutine(routine)}
                >
                  시작하기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'community' && (
        <div className="community-section">
          <h3>커뮤니티 공간</h3>
          <div className="community-posts">
            {communityPosts.map(post => (
              <div key={post.id} className="community-post">
                <div className="post-header">
                  <span className="post-author">{post.author}</span>
                  <span className="post-date">{post.date}</span>
                  <span className={`post-category category-${post.category}`}>
                    {post.category === 'flare-management' ? 'Flare 관리' :
                     post.category === 'emotional-support' ? '정서적 지지' :
                     post.category === 'treatment' ? '치료' : '생활'}
                  </span>
                </div>
                <h4 className="post-title">{post.title}</h4>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <div className="post-tags">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="post-stats">
                    <span>👍 {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 루틴 실행 모달 */}
      {activeRoutine && (
        <div className="routine-modal-overlay" onClick={handleCloseRoutine}>
          <div className="routine-modal" onClick={(e) => e.stopPropagation()}>
            <div className="routine-modal-header">
              <h3>{activeRoutine.name}</h3>
              <button className="close-btn" onClick={handleCloseRoutine}>×</button>
            </div>

            <div className="routine-modal-content">
              <div className="routine-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${((currentStep + 1) / activeRoutine.steps.length) * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  단계 {currentStep + 1} / {activeRoutine.steps.length}
                </p>
              </div>

              <div className="current-step-display">
                <div className="step-number">단계 {currentStep + 1}</div>
                <div className="step-instruction">
                  {activeRoutine.steps[currentStep]}
                </div>
              </div>

              <div className="timer-section">
                <div className="timer-display">
                  <span className="timer-label">경과 시간</span>
                  <span className="timer-value">{formatTime(timer)}</span>
                </div>
                <div className="timer-controls">
                  {!isRunning ? (
                    <button className="btn btn-primary" onClick={handleStartTimer}>
                      ⏯ 시작
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={handleStopTimer}>
                      ⏸ 일시정지
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={handleResetTimer}>
                    🔄 리셋
                  </button>
                </div>
              </div>

              <div className="step-navigation">
                <button 
                  className="btn btn-secondary"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  ← 이전 단계
                </button>
                {currentStep < activeRoutine.steps.length - 1 ? (
                  <button 
                    className="btn btn-primary"
                    onClick={handleNextStep}
                  >
                    다음 단계 →
                  </button>
                ) : (
                  <button 
                    className="btn btn-success"
                    onClick={handleCloseRoutine}
                  >
                    ✅ 완료
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionalCare;

