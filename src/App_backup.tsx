import { useState, useEffect } from 'react';
import { Heart, Activity, Trophy, Home, BookHeart, Brain, Users, ShoppingBag, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import FigmaIntroSlide from './components/FigmaIntroSlide';
import { DashboardView } from './components/DashboardView';
import { HealthJournal } from './components/HealthJournal';
import { PredictionAndCare } from './components/PredictionAndCare';
import { CommunitySpace } from './components/CommunitySpace';
import { CharacterShop } from './components/CharacterShop';
import { KakaoIcon, GoogleIcon } from './components/SocialIcons';
import { Toaster } from './components/ui/sonner';
import { DiagnosisData } from './types';
import './App.css';

function App() {
  const [showFigmaIntro, setShowFigmaIntro] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
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
        onNext={() => setShowIntroSlide3(false)} 
      />
    );
  }

  const tabs = [
    { id: 'today' as const, label: '오늘의 Flare 지수' },
    { id: 'environment' as const, label: '환경 위험도' },
    { id: 'prodromal' as const, label: '전조증상 예측' },
    { id: 'diary' as const, label: 'Flare 일기' },
    { id: 'management' as const, label: 'Flare 관리' },
    { id: 'emotional' as const, label: '심리 케어' }
  ];

  return (
    <div className="app">
      <div className="app-header">
        <h1>Flarecast : 개인 맞춤형 자가면역 관리</h1>
        <div className="main-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`main-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="app-main">
        {activeTab === 'today' && <TodayFlareIndex diagnosisData={diagnosisData} />}
        {activeTab === 'environment' && <EnvironmentalRisk />}
        {activeTab === 'prodromal' && <ProdromalFlarePredictionComponent diagnosisData={diagnosisData} />}
        {activeTab === 'diary' && <FlareDiary />}
        {activeTab === 'management' && <FlareManagement />}
        {activeTab === 'emotional' && <EmotionalCare />}
      </div>

      <div className="app-footer">
        <p>본 서비스는 의학적 진단을 대체하지 않습니다. 증상이 심각하거나 지속되면 전문의와 상담하세요.</p>
        <p className="disclaimer-text">© 2024 Flarecast. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;
