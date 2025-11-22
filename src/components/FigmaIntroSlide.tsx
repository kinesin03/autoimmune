import React from 'react';
import { Activity } from 'lucide-react';
import './FigmaIntroSlide.css';

interface FigmaIntroSlideProps {
  onComplete: () => void;
}

const FigmaIntroSlide: React.FC<FigmaIntroSlideProps> = ({ onComplete }) => {
  const handleClick = () => {
    onComplete();
  };

  return (
    <div 
      className="figma-intro-slide"
      onClick={handleClick}
    >
      <div className="intro-gradient-background">
        <div className="intro-content">
          <div className="intro-icon-wrapper">
            <Activity className="intro-heart-icon" size={80} strokeWidth={2} />
          </div>
          <h1 className="intro-title">Flarecast</h1>
          <p className="intro-subtitle">자가면역질환 케어</p>
          <p className="intro-brand">Bitamin</p>
        </div>
      </div>
    </div>
  );
};

export default FigmaIntroSlide;

