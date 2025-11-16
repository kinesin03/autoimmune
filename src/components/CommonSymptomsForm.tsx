import React from 'react';
import { CommonSymptoms } from '../types';

interface Props {
  symptoms: CommonSymptoms;
  onChange: (symptoms: CommonSymptoms) => void;
}

const CommonSymptomsForm: React.FC<Props> = ({ symptoms, onChange }) => {
  const updateSymptom = (key: keyof CommonSymptoms, value: number) => {
    onChange({ ...symptoms, [key]: value });
  };

  return (
    <div className="form-section">
      <h2>공통 전조증상 자가진단 (0~5점)</h2>
      
      <div className="symptom-item">
        <label>피로감 점수</label>
        <input
          type="range"
          min="0"
          max="5"
          value={symptoms.fatigue}
          onChange={(e) => updateSymptom('fatigue', parseInt(e.target.value))}
        />
        <span className="score">{symptoms.fatigue}점</span>
      </div>

      <div className="symptom-item">
        <label>불안감, 우울감, 집중력 점수</label>
        <input
          type="range"
          min="0"
          max="5"
          value={symptoms.anxietyDepressionConcentration}
          onChange={(e) => updateSymptom('anxietyDepressionConcentration', parseInt(e.target.value))}
        />
        <span className="score">{symptoms.anxietyDepressionConcentration}점</span>
      </div>

      <div className="symptom-item">
        <label>입맛 저하, 소화불량 점수</label>
        <input
          type="range"
          min="0"
          max="5"
          value={symptoms.appetiteDigestion}
          onChange={(e) => updateSymptom('appetiteDigestion', parseInt(e.target.value))}
        />
        <span className="score">{symptoms.appetiteDigestion}점</span>
      </div>

      <div className="symptom-item">
        <label>관절통 점수</label>
        <input
          type="range"
          min="0"
          max="5"
          value={symptoms.jointPain}
          onChange={(e) => updateSymptom('jointPain', parseInt(e.target.value))}
        />
        <span className="score">{symptoms.jointPain}점</span>
      </div>

      <div className="symptom-item">
        <label>피부 이상(붉은기, 건조, 가려움) 점수</label>
        <input
          type="range"
          min="0"
          max="5"
          value={symptoms.skinAbnormalities}
          onChange={(e) => updateSymptom('skinAbnormalities', parseInt(e.target.value))}
        />
        <span className="score">{symptoms.skinAbnormalities}점</span>
      </div>
    </div>
  );
};

export default CommonSymptomsForm;


