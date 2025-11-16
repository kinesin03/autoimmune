import React from 'react';
import { DiagnosisData } from '../types';
import { predictFlareFromProdromalSymptoms } from '../utils/prodromalFlarePrediction';
import './ProdromalFlarePrediction.css';

interface Props {
  diagnosisData: DiagnosisData;
}

const ProdromalFlarePredictionComponent: React.FC<Props> = ({ diagnosisData }) => {
  const prediction = predictFlareFromProdromalSymptoms(
    diagnosisData.commonSymptoms,
    diagnosisData.diseaseSpecific
  );

  return (
    <div className={`prodromal-prediction prediction-${prediction.riskLevel}`}>
      <h3>전조 증상 기반 Flare 예측</h3>
      
      <div className="prediction-scores">
        <div className="score-item">
          <span className="score-label">공통 증상 점수</span>
          <span className="score-value">{prediction.commonScore} / 25</span>
        </div>
        <div className="score-item">
          <span className="score-label">질환별 증상 점수</span>
          <span className="score-value">{prediction.diseaseSpecificScore}</span>
        </div>
        <div className="score-item total">
          <span className="score-label">총점</span>
          <span className="score-value-large">{prediction.totalScore}</span>
        </div>
      </div>

      <div className="prediction-risk">
        <div className="risk-level-badge">
          <span className={`risk-badge risk-${prediction.riskLevel}`}>
            {prediction.riskLevel === 'critical' ? '매우 높음' :
             prediction.riskLevel === 'high' ? '높음' :
             prediction.riskLevel === 'medium' ? '보통' : '낮음'}
          </span>
          <span className="risk-probability">예상 확률: {prediction.probability}%</span>
        </div>
      </div>

      <div className="prediction-message">
        {prediction.message.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <div className="contributing-symptoms">
        <h4>기여 증상:</h4>
        <div className="symptoms-list">
          {prediction.contributingSymptoms.map((symptom, i) => (
            <span key={i} className="symptom-tag">{symptom}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProdromalFlarePredictionComponent;

