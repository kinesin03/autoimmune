import React from 'react';
import './IntroSlide2.css';

interface IntroSlide2Props {
  onNext: () => void;
  onSkip: () => void;
}

const IntroSlide2: React.FC<IntroSlide2Props> = ({ onNext, onSkip }) => {
  return (
    <div className="intro-slide-2">
      <div className="slide-content">
        <div className="icon-container">
          <div className="icon-gradient-circle">
            <svg className="icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M15 60 L25 40 L35 70 L45 30 L55 80 L65 50 L75 60 L85 40" 
                stroke="white" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
        
        <div className="text-content">
          <h2 className="main-text">AI 기반 증상 추적</h2>
          <p className="sub-text">일일 증상과 컨디션을 기록하면<br />AI가 패턴을 분석하고 관리해줍니다</p>
        </div>
        
        <div className="pagination">
          <div className="dot"></div>
          <div className="dot active"></div>
          <div className="dot"></div>
        </div>
        
        <button className="next-button" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  );
};

export default IntroSlide2;

