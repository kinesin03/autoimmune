import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 2초 후 페이드 아웃 시작
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // 2.5초 후 메인 앱으로 전환
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div 
      className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleClick}
    >
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          <div className="splash-content">
            <div className="splash-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="20" fill="white" fillOpacity="0.95"/>
                <path 
                  d="M15 70 L25 50 L35 60 L45 30 L55 65 L65 45 L75 55 L85 40" 
                  stroke="url(#gradient)" 
                  strokeWidth="5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#C44569" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="splash-title">Flare Guide</h1>
            <p className="splash-subtitle">자가면역질환 케어</p>
            <p className="splash-brand">Bitamin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

