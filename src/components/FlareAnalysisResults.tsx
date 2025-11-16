import React from 'react';
import { FlareManagementData } from '../types';
import './FlareAnalysisResults.css';

interface Props {
  data: FlareManagementData;
}

const FlareAnalysisResults: React.FC<Props> = ({ data }) => {
  const hasData = data.flares.length > 0 || 
                 data.stressRecords.length > 0 || 
                 data.foodRecords.length > 0 || 
                 data.sleepRecords.length > 0;

  if (!hasData) {
    return (
      <div className="analysis-results">
        <div className="no-data-message">
          <p>분석을 위해 최소 하나 이상의 기록이 필요합니다.</p>
          <p>기록하기 탭에서 Flare, 스트레스, 음식, 수면 기록을 추가해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-results">
      {/* 통합 분석 및 경고 */}
      {data.riskAnalysis && (
        <div className={`risk-alert risk-${data.riskAnalysis.riskLevel}`}>
          <h3>⚠️ Flare 위험 분석</h3>
          <div className="risk-score">
            <span>위험 점수: {data.riskAnalysis.riskScore}/100</span>
            <span className={`risk-level-badge risk-${data.riskAnalysis.riskLevel}`}>
              {data.riskAnalysis.riskLevel === 'critical' ? '매우 높음' :
               data.riskAnalysis.riskLevel === 'high' ? '높음' :
               data.riskAnalysis.riskLevel === 'medium' ? '보통' : '낮음'}
            </span>
          </div>
          <div className="risk-message">
            {data.riskAnalysis.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="risk-factors">
            <h4>위험 요인:</h4>
            <ul>
              {data.riskAnalysis.factors.stress && <li>스트레스</li>}
              {data.riskAnalysis.factors.food && <li>음식</li>}
              {data.riskAnalysis.factors.sleep && <li>수면 부족</li>}
              {!data.riskAnalysis.factors.stress && 
               !data.riskAnalysis.factors.food && 
               !data.riskAnalysis.factors.sleep && 
               <li>현재 위험 요인 없음</li>}
            </ul>
          </div>
          <div className="recommendations">
            <h4>권장 사항:</h4>
            <ul>
              {data.riskAnalysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 스트레스 상관 분석 */}
      {data.stressCorrelation && data.flares.length > 0 && data.stressRecords.length > 0 && (
        <div className="analysis-card">
          <h3>스트레스 상관 분석</h3>
          <div className="correlation-info">
            <div className="correlation-value">
              <span>상관계수: {data.stressCorrelation.correlation.toFixed(2)}</span>
            </div>
            {data.stressCorrelation.averageDaysToFlare > 0 && (
              <div className="correlation-detail">
                <span>평균 Flare 발생까지: {data.stressCorrelation.averageDaysToFlare}일</span>
              </div>
            )}
            <div className="correlation-detail">
              <span>스트레스 높은 주의 Flare: {data.stressCorrelation.highStressFlareCount}회</span>
            </div>
          </div>
          <div className="correlation-message">
            {data.stressCorrelation.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* 음식 상관 분석 */}
      {data.foodCorrelations.length > 0 && (
        <div className="analysis-card">
          <h3>음식 상관 분석</h3>
          <div className="food-correlations">
            {data.foodCorrelations.map((correlation, i) => (
              <div 
                key={i} 
                className={`food-item food-${correlation.recommendation}`}
              >
                <div className="food-header">
                  <span className="food-name">{correlation.food}</span>
                  <span className={`food-recommendation rec-${correlation.recommendation}`}>
                    {correlation.recommendation === 'avoid' ? '피하기' :
                     correlation.recommendation === 'moderate' ? '주의' : '안전'}
                  </span>
                </div>
                <div className="food-stats">
                  <span>Flare 확률: {correlation.flareProbability}%</span>
                  {correlation.averageHoursToSymptom > 0 && (
                    <span>평균 증상 발생: {correlation.averageHoursToSymptom}시간 후</span>
                  )}
                </div>
                <div className="food-message">
                  {correlation.message.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수면 상관 분석 */}
      {data.sleepCorrelation && data.flares.length > 0 && data.sleepRecords.length > 0 && (
        <div className="analysis-card">
          <h3>수면 상관 분석</h3>
          <div className="correlation-info">
            <div className="correlation-value">
              <span>상관계수: {data.sleepCorrelation.correlation.toFixed(2)}</span>
            </div>
            <div className="correlation-detail">
              <span>권장 수면 시간: {data.sleepCorrelation.recommendedHours}시간</span>
            </div>
          </div>
          <div className="correlation-message">
            {data.sleepCorrelation.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* 데이터 요약 */}
      <div className="data-summary">
        <h3>데이터 요약</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Flare 기록</span>
            <span className="summary-value">{data.flares.length}회</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">스트레스 기록</span>
            <span className="summary-value">{data.stressRecords.length}일</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">음식 기록</span>
            <span className="summary-value">{data.foodRecords.length}회</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">수면 기록</span>
            <span className="summary-value">{data.sleepRecords.length}일</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlareAnalysisResults;

