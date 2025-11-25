import React from 'react';
import './IntroSlide3.css';

interface IntroSlide3Props {
  onNext: () => void;
}

const IntroSlide3: React.FC<IntroSlide3Props> = ({ onNext }) => {
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('시작하기 버튼 클릭됨');
    onNext();
  };

  return (
    <div className="intro-slide-3">
      <div className="slide-content">
        <div className="icon-container">
          <div className="icon-gradient-circle">
            <svg className="icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="25" width="50" height="50" rx="8" stroke="white" strokeWidth="4" fill="none"/>
              <circle cx="40" cy="40" r="3" fill="white"/>
              <circle cx="60" cy="40" r="3" fill="white"/>
              <path d="M35 60 Q50 70 65 60" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>
        
        <div className="text-content">
          <h2 className="main-text">게임처럼 즐겁게</h2>
          <p className="sub-text">미션을 완료하고 리워드를 받으며<br />건강 관리를 재미있게 지속하세요</p>
        </div>
        
        <div className="pagination">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot active"></div>
        </div>
        
        <button className="next-button" onClick={handleNext} type="button">
          시작하기
        </button>
      </div>
    </div>
  );
};

export default IntroSlide3;

