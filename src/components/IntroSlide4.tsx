import React, { useState } from 'react';
import './IntroSlide4.css';

interface IntroSlide4Props {
  onNext: () => void;
}

const DISEASE_OPTIONS = [
  '류마티스 관절염',
  '건선',
  '크론병',
  '제1형 당뇨병',
  '다발성 경화증(MS)',
  '루푸스(SLE)',
  '쇼그렌 증후군',
  '자가면역성 갑상선 질환'
];

const IntroSlide4: React.FC<IntroSlide4Props> = ({ onNext }) => {
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>(() => {
    const saved = localStorage.getItem('userDiseases');
    return saved ? JSON.parse(saved) : [];
  });
  const [otherDisease, setOtherDisease] = useState<string>('');

  const handleDiseaseToggle = (disease: string) => {
    setSelectedDiseases(prev => {
      if (prev.includes(disease)) {
        return prev.filter(d => d !== disease);
      } else {
        return [...prev, disease];
      }
    });
  };

  const handleNext = () => {
    // 선택한 질병과 기타 질병을 합쳐서 저장
    const allDiseases = [...selectedDiseases];
    if (otherDisease.trim()) {
      allDiseases.push(otherDisease.trim());
    }
    
    localStorage.setItem('userDiseases', JSON.stringify(allDiseases));
    onNext();
  };

  const isNextDisabled = selectedDiseases.length === 0 && !otherDisease.trim();

  return (
    <div className="intro-slide-4">
      <div className="slide-content">
        <div className="question-header">
          <div className="heart-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <h2 className="question-title">어떤 자가면역질환을<br />가지고 계신가요?</h2>
          <p className="question-subtitle">해당하는 항목을 모두 선택해주세요</p>
        </div>

        <div className="disease-list">
          {DISEASE_OPTIONS.map((disease) => (
            <label key={disease} className="disease-card">
              <span className="disease-name">{disease}</span>
              <input
                type="checkbox"
                checked={selectedDiseases.includes(disease)}
                onChange={() => handleDiseaseToggle(disease)}
                className="disease-checkbox-input"
              />
            </label>
          ))}
          
          <div className="other-disease-section">
            <label className="disease-card">
              <span className="disease-name">기타</span>
              <input
                type="checkbox"
                checked={otherDisease.trim().length > 0}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setOtherDisease('');
                  }
                }}
                className="disease-checkbox-input"
              />
            </label>
            <input
              type="text"
              className="other-disease-input"
              placeholder="직접 입력해주세요"
              value={otherDisease}
              onChange={(e) => {
                setOtherDisease(e.target.value);
              }}
            />
          </div>
        </div>

        <button
          className={`next-button ${isNextDisabled ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={isNextDisabled}
          type="button"
        >
          다음으로
          <span className="next-arrow">›</span>
        </button>
      </div>
    </div>
  );
};

export default IntroSlide4;

