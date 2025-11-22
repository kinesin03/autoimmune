import React, { useEffect, useState } from 'react';
import './FigmaIntro.css';

interface FigmaIntroProps {
  onComplete: () => void;
}

const FigmaIntro: React.FC<FigmaIntroProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 3초 후 페이드 아웃 시작
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // 3.3초 후 다음 페이지로 전환
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
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
      className={`figma-intro ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleClick}
    >
      <iframe 
        className="figma-intro-iframe"
        src="https://embed.figma.com/proto/HO5HKEGZ5J5GWLyZhAEPHb/%EC%9D%B8%ED%8A%B8%EB%A1%9C?node-id=3-55&embed-host=share" 
        allowFullScreen
        title="Figma Intro Design"
      />
    </div>
  );
};

export default FigmaIntro;

