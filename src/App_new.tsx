import { useState, useEffect } from "react";
import { Heart, Activity, Trophy, Home, BookHeart, Brain, Users, ShoppingBag, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { DashboardView } from "./components/DashboardView";
import { HealthJournal } from "./components/HealthJournal";
import { PredictionAndCare } from "./components/PredictionAndCare";
import { CommunitySpace } from "./components/CommunitySpace";
import { CharacterShop } from "./components/CharacterShop";
import { KakaoIcon, GoogleIcon } from "./components/SocialIcons";
import { Toaster } from "./components/ui/sonner";
import FigmaIntroSlide from './components/FigmaIntroSlide';
import './App.css';

export default function App() {
  const [showFigmaIntro, setShowFigmaIntro] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (showFigmaIntro) {
      const timer = setTimeout(() => {
        setShowFigmaIntro(false);
        setShowSplash(true);
      }, 3300);
      return () => clearTimeout(timer);
    }
  }, [showFigmaIntro]);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const onboardingSteps = [
    {
      icon: Heart,
      title: "자가면역질환 케어",
      description: "매일의 건강 상태를 기록하고\n관리하는 당신의 건강 파트너",
      color: "from-purple-400 to-fuchsia-600"
    },
    {
      icon: Activity,
      title: "AI 기반 증상 추적",
      description: "일일 증상과 컨디션을 기록하면\nAI가 패턴을 분석하고 관리해줍니다",
      color: "from-fuchsia-500 to-pink-600"
    },
    {
      icon: Trophy,
      title: "게임처럼 즐겁게",
      description: "미션을 완료하고 리워드를 받으며\n건강 관리를 재미있게 지속하세요",
      color: "from-pink-500 to-purple-600"
    }
  ];

  const currentSlide = onboardingSteps[currentStep];
  const Icon = currentSlide?.icon;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowLogin(true);
    }
  };

  const handleSkip = () => {
    setShowLogin(true);
  };

  const handleBack = () => {
    if (showLogin) {
      setShowLogin(false);
      setCurrentStep(onboardingSteps.length - 1);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogin = () => {
    if (phoneNumber === "01012341234" && password === "bitamin") {
      setLoginError("");
      setShowWelcome(true);
      setTimeout(() => {
        setShowWelcome(false);
        setShowHome(true);
      }, 3000);
    } else {
      setLoginError("전화번호 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "home":
        return <DashboardView />;
      case "journal":
        return <HealthJournal />;
      case "ai":
        return <PredictionAndCare />;
      case "community":
        return <CommunitySpace />;
      case "shop":
        return <CharacterShop />;
      default:
        return <DashboardView />;
    }
  };

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
          setShowSplash(true);
        }}
      />
    );
  }

  if (showSplash) {
    return renderWithPhoneFrame(
      <div className="splash-container">
        <div className="splash-logo">Flarecast</div>
        <div className="splash-loading">로딩 중...</div>
      </div>
    );
  }

  if (showWelcome) {
    return renderWithPhoneFrame(
      <div className="welcome-container">
        <h1>환영합니다!</h1>
        <p>Flarecast에 오신 것을 환영합니다.</p>
      </div>
    );
  }

  if (showHome) {
    return renderWithPhoneFrame(
      <div className="home-container">
        <div className="home-header">
          <h1>Flarecast</h1>
        </div>
        <div className="home-tabs">
          <button 
            className={activeTab === "home" ? "active" : ""}
            onClick={() => setActiveTab("home")}
          >
            <Home /> 홈
          </button>
          <button 
            className={activeTab === "journal" ? "active" : ""}
            onClick={() => setActiveTab("journal")}
          >
            <BookHeart /> 일기
          </button>
          <button 
            className={activeTab === "ai" ? "active" : ""}
            onClick={() => setActiveTab("ai")}
          >
            <Brain /> AI
          </button>
          <button 
            className={activeTab === "community" ? "active" : ""}
            onClick={() => setActiveTab("community")}
          >
            <Users /> 커뮤니티
          </button>
          <button 
            className={activeTab === "shop" ? "active" : ""}
            onClick={() => setActiveTab("shop")}
          >
            <ShoppingBag /> 샵
          </button>
        </div>
        <div className="home-content">
          {renderMainContent()}
        </div>
      </div>
    );
  }

  if (showLogin) {
    return renderWithPhoneFrame(
      <div className="login-container">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft /> 뒤로
        </button>
        <div className="login-content">
          <h1>로그인</h1>
          <div className="login-form">
            <Input
              type="tel"
              placeholder="전화번호"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="password-input-wrapper">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <Button onClick={handleLogin} className="login-button">
              로그인
            </Button>
            <div className="social-login">
              <Button variant="outline" className="social-button">
                <KakaoIcon className="social-icon" /> 카카오 로그인
              </Button>
              <Button variant="outline" className="social-button">
                <GoogleIcon className="social-icon" /> 구글 로그인
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 온보딩 슬라이드
  return renderWithPhoneFrame(
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="onboarding-slide"
        >
          {currentStep > 0 && (
            <button className="skip-button" onClick={handleSkip}>
              건너뛰기
            </button>
          )}
          <div className="slide-content">
            <div className={`icon-circle bg-gradient-to-br ${currentSlide?.color}`}>
              {Icon && <Icon className="icon" size={60} />}
            </div>
            <h2 className="slide-title">{currentSlide?.title}</h2>
            <p className="slide-description">{currentSlide?.description}</p>
            <div className="pagination-dots">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`dot ${index === currentStep ? 'active' : ''}`}
                />
              ))}
            </div>
            <Button onClick={handleNext} className="next-button">
              {currentStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </div>
  );
}


