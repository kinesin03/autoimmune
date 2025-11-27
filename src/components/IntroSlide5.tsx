import React, { useState } from 'react';
import './IntroSlide5.css';

interface IntroSlide5Props {
  onNext: () => void;
}

interface FlareSeverityScores {
  systemic: number; // 전신 증상
  mental: number; // 정신적 변화
  digestive: number; // 소화계 문제
  musculoskeletal: number; // 근골격계
  skinDryness: number; // 피부/건조
}

const IntroSlide5: React.FC<IntroSlide5Props> = ({ onNext }) => {
  const [scores, setScores] = useState<FlareSeverityScores>(() => {
    const saved = localStorage.getItem('flareSeverityScores');
    return saved ? JSON.parse(saved) : {
      systemic: 0,
      mental: 0,
      digestive: 0,
      musculoskeletal: 0,
      skinDryness: 0
    };
  });

  const handleScoreChange = (category: keyof FlareSeverityScores, value: number) => {
    setScores(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleNext = () => {
    localStorage.setItem('flareSeverityScores', JSON.stringify(scores));
    onNext();
  };

  const categories = [
    {
      key: 'systemic' as keyof FlareSeverityScores,
      title: '1. 전신 증상',
      description: '피로, 미열, 몸살'
    },
    {
      key: 'mental' as keyof FlareSeverityScores,
      title: '2. 정신적 변화',
      description: '불안, 우울, 집중력 저하'
    },
    {
      key: 'digestive' as keyof FlareSeverityScores,
      title: '3. 소화계 문제',
      description: '입맛 저하, 소화불량, 복부 불편'
    },
    {
      key: 'musculoskeletal' as keyof FlareSeverityScores,
      title: '4. 근골격계',
      description: '관절통, 뻣뻣함'
    },
    {
      key: 'skinDryness' as keyof FlareSeverityScores,
      title: '5. 피부/건조',
      description: '피부 가려움, 건조, 붉은기, 눈·입 건조'
    }
  ];

  return (
    <div className="intro-slide-5">
      <div className="slide-content">
        <div className="question-header">
          <h2 className="question-title">flare-up이 심했을 때,<br />이런 증상은 얼마나 심했나요?</h2>
          <p className="question-subtitle">각 항목을 0-10점으로 평가해주세요</p>
        </div>

        <div className="severity-list">
          {categories.map((category) => (
            <div key={category.key} className="severity-card">
              <div className="severity-header">
                <div className="severity-title-wrapper">
                  <h3 className="severity-title">{category.title}</h3>
                  <p className="severity-description">{category.description}</p>
                </div>
              </div>
              
              <div className="severity-input-section">
                <div className="severity-slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={scores[category.key]}
                    onChange={(e) => handleScoreChange(category.key, parseInt(e.target.value))}
                    className="severity-slider"
                  />
                  <div className="severity-labels">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="severity-score-display">
                  <span className="score-value">{scores[category.key]}</span>
                  <span className="score-unit">/ 10</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="next-button"
          onClick={handleNext}
          type="button"
        >
          다음으로
          <span className="next-arrow">›</span>
        </button>
      </div>
    </div>
  );
};

export default IntroSlide5;

