import { useState, useEffect } from 'react';
import { Home, BookHeart, BarChart3, Brain, Users, Stethoscope } from 'lucide-react';
import FigmaIntroSlide from './components/FigmaIntroSlide';
import IntroSlide1 from './components/IntroSlide1';
import IntroSlide2 from './components/IntroSlide2';
import IntroSlide3 from './components/IntroSlide3';
import IntroSlide4 from './components/IntroSlide4';
import IntroSlide5 from './components/IntroSlide5';
import TodayFlareIndexNew from './components/TodayFlareIndexNew';
import ProdromalFlarePredictionComponent from './components/ProdromalFlarePrediction';
import FlareDiary from './components/FlareDiary';
import FlareManagement from './components/FlareManagement';
import EmotionalCare from './components/EmotionalCare';
import CommunitySpace from './components/CommunitySpace';
import { DiagnosisData } from './types';
import { getGameData } from './utils/gameSystem';
import './App.css';
import './AppNewDesign.css';

function App() {
  // localStorage에서 인트로 완료 상태 확인
  const [showFigmaIntro, setShowFigmaIntro] = useState(() => {
    // 인트로를 항상 표시하도록 설정 (테스트용)
    // const introCompleted = localStorage.getItem('introCompleted');
    // return introCompleted !== 'true';
    return true;
  });
  const [showIntroSlide1, setShowIntroSlide1] = useState(false);
  const [showIntroSlide2, setShowIntroSlide2] = useState(false);
  const [showIntroSlide3, setShowIntroSlide3] = useState(false);
  const [showIntroSlide4, setShowIntroSlide4] = useState(false);
  const [showIntroSlide5, setShowIntroSlide5] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'environment' | 'prodromal' | 'diary' | 'management' | 'emotional'>('today');
  const [gameData, setGameData] = useState(getGameData());
  const [diagnosisData] = useState<DiagnosisData>(() => {
    const saved = localStorage.getItem('diagnosisData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load diagnosis data:', e);
      }
    }
    return {
      commonSymptoms: {
        fatigue: 0,
        anxietyDepressionConcentration: 0,
        appetiteDigestion: 0,
        jointPain: 0,
        skinAbnormalities: 0
      },
      diseaseSpecific: {}
    };
  });

  useEffect(() => {
    localStorage.setItem('diagnosisData', JSON.stringify(diagnosisData));
  }, [diagnosisData]);

  useEffect(() => {
    // 게임 데이터 주기적 업데이트
    const interval = setInterval(() => {
      setGameData(getGameData());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 전체를 하나의 휴대폰 프레임으로 감싸기
  const renderWithPhoneFrame = (content: React.ReactNode) => {
    return (
      <div className="app-wrapper">
        <div className="phone-frame">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {content}
          </div>
        </div>
      </div>
    );
  };

  if (showFigmaIntro) {
    return renderWithPhoneFrame(
      <FigmaIntroSlide 
        onComplete={() => {
          setShowFigmaIntro(false);
          setShowIntroSlide1(true);
        }}
      />
    );
  }

  if (showIntroSlide1) {
    return renderWithPhoneFrame(
      <IntroSlide1 
        onNext={() => {
          setShowIntroSlide1(false);
          setShowIntroSlide2(true);
        }}
        onSkip={() => {
          setShowIntroSlide1(false);
          setShowIntroSlide2(true);
        }}
      />
    );
  }

  if (showIntroSlide2) {
    return renderWithPhoneFrame(
      <IntroSlide2 
        onNext={() => {
          setShowIntroSlide2(false);
          setShowIntroSlide3(true);
        }} 
        onSkip={() => {
          setShowIntroSlide2(false);
          setShowIntroSlide3(true);
        }} 
      />
    );
  }

  if (showIntroSlide3) {
    return renderWithPhoneFrame(
      <IntroSlide3 
        onNext={() => {
          console.log('IntroSlide3 onNext called');
          setShowIntroSlide3(false);
          setShowIntroSlide4(true);
        }} 
      />
    );
  }

  if (showIntroSlide4) {
    return renderWithPhoneFrame(
      <IntroSlide4 
        onNext={() => {
          console.log('IntroSlide4 onNext called');
          setShowIntroSlide4(false);
          setShowIntroSlide5(true);
        }} 
      />
    );
  }

  if (showIntroSlide5) {
    return renderWithPhoneFrame(
      <IntroSlide5 
        onNext={() => {
          console.log('IntroSlide5 onNext called');
          localStorage.setItem('introCompleted', 'true');
          setShowIntroSlide5(false);
        }} 
      />
    );
  }

  const bottomNavTabs = [
    { id: 'today' as const, label: '홈', icon: Home },
    { id: 'diary' as const, label: '일지', icon: BookHeart },
    { id: 'management' as const, label: 'AI분석', icon: Brain },
    { id: 'emotional' as const, label: '케어', icon: Stethoscope },
    { id: 'environment' as const, label: '커뮤니티', icon: Users }
  ];

  return renderWithPhoneFrame(
    <div className="app-new-design" style={{ height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {activeTab === 'today' && (
        <div className="app-top-header">
          <div className="greeting-section">
            <h2 className="greeting-text">안녕하세요 꿈돌이님</h2>
            {(() => {
              const savedDiseases = localStorage.getItem('userDiseases');
              const diseases = savedDiseases ? JSON.parse(savedDiseases) : [];
              if (diseases.length > 0) {
                return (
                  <p className="user-diseases">
                    {diseases.join(', ')}
                  </p>
                );
              }
              return null;
            })()}
          </div>
          <div className="header-icons">
            <div className="coin-display">
              <span className="coin-icon">🪙</span>
              <span className="coin-amount" id="coin-display">{gameData.coins}</span>
            </div>
            <div className="trophy-icon">🏆</div>
          </div>
        </div>
      )}

      <div className="app-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px' }}>
        {activeTab === 'today' && <TodayFlareIndexNew diagnosisData={diagnosisData} />}
        {activeTab === 'environment' && <CommunitySpace />}
        {activeTab === 'prodromal' && <ProdromalFlarePredictionComponent diagnosisData={diagnosisData} />}
        {activeTab === 'diary' && <FlareDiary />}
        {activeTab === 'management' && <FlareManagement />}
        {activeTab === 'emotional' && <EmotionalCare />}
      </div>

      <div className="bottom-nav">
        {bottomNavTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;
