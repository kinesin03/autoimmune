import React, { useState, useEffect } from 'react';
import { Lightbulb, Calendar } from 'lucide-react';
import { StressReliefRoutine } from '../types';
import { trackActivity } from '../utils/gameSystem';
import './EmotionalCare.css';

const EmotionalCare: React.FC = () => {
  const [nextCheckup, setNextCheckup] = useState<string>('2025-12-01');
  const [activeRoutine, setActiveRoutine] = useState<StressReliefRoutine | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // 스트레스 완화 루틴
  const stressReliefRoutines: StressReliefRoutine[] = [
    {
      id: 'breathing',
      name: '심호흡 운동',
      description: '깊고 천천히 호흡하여 스트레스를 완화하세요',
      duration: 5,
      category: 'breathing',
      steps: [
        '편안한 자세로 앉거나 누우세요',
        '4초 동안 코로 천천히 숨을 들이쉬세요',
        '4초 동안 숨을 참으세요',
        '4초 동안 입으로 천천히 숨을 내쉬세요',
        '이 과정을 5-10회 반복하세요'
      ]
    },
    {
      id: 'meditation',
      name: '명상',
      description: '마음을 차분하게 하여 스트레스를 줄이세요',
      duration: 10,
      category: 'meditation',
      steps: [
        '조용한 장소에서 편안하게 앉으세요',
        '눈을 감고 자연스럽게 호흡하세요',
        '몸의 긴장을 풀어주세요',
        '생각이 떠오르면 그냥 지나가게 두세요',
        '10분간 이 상태를 유지하세요'
      ]
    },
    {
      id: 'stretching',
      name: '가벼운 스트레칭',
      description: '관절과 근육을 풀어주는 가벼운 스트레칭',
      duration: 10,
      category: 'exercise',
      steps: [
        '목과 어깨를 천천히 돌려주세요',
        '팔을 위로 뻗어 몸을 쭉 펴주세요',
        '다리를 앞으로 뻗어 발목을 돌려주세요',
        '등을 곧게 펴고 숨을 깊게 들이쉬세요',
        '각 동작을 10초씩 유지하세요'
      ]
    },
    {
      id: 'music',
      name: '음악 감상',
      description: '편안한 음악을 들으며 마음을 진정시키세요',
      duration: 15,
      category: 'music',
      steps: [
        '편안한 음악을 선택하세요',
        '조용한 장소에서 눈을 감으세요',
        '음악에 집중하며 호흡을 따라가세요',
        '긴장을 풀고 몸을 이완시키세요',
        '15분간 음악에 몰입하세요'
      ]
    }
  ];

  // 맞춤 건강 조언
  const healthAdvice = [
    {
      id: 1,
      title: '수면 패턴 개선',
      content: '매일 밤 10시 30분에 취침하면 충분한 수면을 취할 수 있어요.'
    },
    {
      id: 2,
      title: '가벼운 스트레칭 추가',
      content: '아침에 10분 스트레칭으로 관절 경직을 줄여보세요.'
    },
    {
      id: 3,
      title: '항염증 식단',
      content: '오메가-3가 풍부한 생선을 주 2회 섭취하면 도움이 됩니다.'
    }
  ];


  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  // 다음 검진까지 남은 일수
  const daysUntilCheckup = Math.ceil((new Date(nextCheckup).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // 스트레스 완화 루틴 핸들러
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

  const handleCompleteRoutine = () => {
    trackActivity('emotional');
    handleCloseRoutine();
  };

  // 타이머 효과
  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="emotional-care">
      {/* 헤더 */}
      <div className="care-header">
        <div className="header-content">
          <div className="header-text-wrapper">
            <h1 className="care-title">케어</h1>
            <p className="care-subtitle">맞춤형 건강 관리</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 - 흰색 박스 */}
      <div className="care-content-wrapper">
        {/* 맞춤 건강 조언 */}
        <div className="health-advice-card">
          <div className="advice-header">
            <Lightbulb size={20} className="advice-icon" />
            <h3 className="section-title">맞춤 건강 조언</h3>
          </div>
          <div className="advice-list">
            {healthAdvice.map(advice => (
              <div key={advice.id} className="advice-item">
                <div className="advice-number">{advice.id}</div>
                <div className="advice-content">
                  <div className="advice-title">{advice.title}</div>
                  <div className="advice-text">{advice.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 스트레스 완화 루틴 */}
        <div className="stress-routine-card">
          <h3 className="section-title">스트레스 완화 루틴</h3>
          <div className="routines-grid">
            {stressReliefRoutines.map(routine => (
              <div key={routine.id} className="routine-card">
                <div className="routine-header">
                  <h4 className="routine-name">{routine.name}</h4>
                  <span className="routine-duration">{routine.duration}분</span>
                </div>
                <p className="routine-description">{routine.description}</p>
                <button 
                  className="routine-start-btn"
                  onClick={() => handleStartRoutine(routine)}
                >
                  시작하기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 검진 예정일 */}
        <div className="health-score-card">
          <div className="checkup-section">
            <div className="checkup-header">
              <Calendar size={20} className="checkup-icon" />
              <h3 className="section-title">다음 검진 예정</h3>
            </div>
            <div className="checkup-content">
              <div className="checkup-date">{new Date(nextCheckup).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="checkup-days-badge">{daysUntilCheckup}일 남음</div>
              <button className="checkup-prepare-btn">검진 준비하기</button>
            </div>
          </div>
        </div>
      </div>

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
                    onClick={handleCompleteRoutine}
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
