import React from 'react';
import './IntroSlide1.css';

interface IntroSlide1Props {
  onNext: () => void;
  onSkip: () => void;
}

const IntroSlide1: React.FC<IntroSlide1Props> = ({ onNext, onSkip }) => {
  return (
    <div className="intro-slide-1">
      <button className="skip-button" onClick={onSkip}>
        건너뛰기
      </button>
      
      <div className="slide-content">
        <div className="heart-container">
          <div className="heart-gradient-circle">
            <svg className="heart-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M50 85C50 85 20 60 20 40C20 25 32.5 15 50 30C67.5 15 80 25 80 40C80 60 50 85 50 85Z" 
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
          <h2 className="main-text">자가면역질환 케어</h2>
          <p className="sub-text">매일의 건강 상태를 기록하고<br />관리하는 당신의 건강 파트너</p>
        </div>
        
        <div className="pagination">
          <div className="dot active"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        
        <button className="next-button" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  );
};

export default IntroSlide1;

