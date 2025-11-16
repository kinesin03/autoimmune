import React, { useState, useEffect } from 'react';
import { DiagnosisData, FlareManagementData } from '../types';
import { predictFlareFromProdromalSymptoms } from '../utils/prodromalFlarePrediction';
import { analyzeFlareRisk, analyzeStressCorrelation, analyzeFoodCorrelation, analyzeSleepCorrelation } from '../utils/flareAnalysis';
import { analyzeEnvironmentalRisk } from '../utils/environmentalRiskAnalysis';
import { fetchEnvironmentalData } from '../utils/weather/environmentalDataFetcher';
import './TodayFlareIndex.css';

interface TodayFlareIndexProps {
  diagnosisData: DiagnosisData;
}

interface FlareIndexData {
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  message: string;
  factors: {
    symptoms: number;
    environment: number;
    lifestyle: number;
  };
  recommendations: string[];
}

const TodayFlareIndex: React.FC<TodayFlareIndexProps> = ({ diagnosisData }) => {
  const [flareIndex, setFlareIndex] = useState<FlareIndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateFlareIndex = async () => {
      setLoading(true);
      try {
        // 1. 전조증상 기반 예측
        const symptomPrediction = predictFlareFromProdromalSymptoms(
          diagnosisData.commonSymptoms,
          diagnosisData.diseaseSpecific
        );

        // 2. 환경 위험도 분석
        const today = new Date().toISOString().split('T')[0];
        const environmentalData = await fetchEnvironmentalData(today);
        const environmentalRisk = analyzeEnvironmentalRisk([environmentalData]);

        // 3. Flare 유발 요인 분석 (localStorage에서)
        let lifestyleRisk: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical'; factors: { stress: boolean; food: boolean; sleep: boolean }; message: string; recommendations: string[] } = { 
          riskScore: 0, 
          riskLevel: 'low', 
          factors: { stress: false, food: false, sleep: false }, 
          message: '', 
          recommendations: [] 
        };
        try {
          const saved = localStorage.getItem('flareManagementData');
          if (saved) {
            const flareData: FlareManagementData = JSON.parse(saved);
            if (flareData.flares.length > 0 || flareData.stressRecords.length > 0 || 
                flareData.foodRecords.length > 0 || flareData.sleepRecords.length > 0) {
              const stressCorrelation = analyzeStressCorrelation(flareData.flares, flareData.stressRecords);
              const foodCorrelations = analyzeFoodCorrelation(flareData.flares, flareData.foodRecords);
              const sleepCorrelation = analyzeSleepCorrelation(flareData.flares, flareData.sleepRecords);
              
              lifestyleRisk = analyzeFlareRisk({
                ...flareData,
                stressCorrelation,
                foodCorrelations,
                sleepCorrelation
              });
            }
          }
        } catch (e) {
          console.error('Flare 유발 요인 데이터 로드 실패:', e);
        }

        // 4. 종합 점수 계산 (가중 평균)
        const symptomWeight = 0.4; // 전조증상 40%
        const environmentWeight = 0.3; // 환경 30%
        const lifestyleWeight = 0.3; // 생활습관 30%

        const symptomScore = symptomPrediction.totalScore;
        const environmentScore = environmentalRisk.riskScore;
        const lifestyleScore = lifestyleRisk.riskScore;

        const totalScore = Math.min(100, 
          symptomScore * symptomWeight + 
          environmentScore * environmentWeight + 
          lifestyleScore * lifestyleWeight
        );

        // 5. 위험 수준 결정
        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        let probability: number;

        if (totalScore >= 70) {
          riskLevel = 'critical';
          probability = 80;
        } else if (totalScore >= 50) {
          riskLevel = 'high';
          probability = 60;
        } else if (totalScore >= 30) {
          riskLevel = 'medium';
          probability = 40;
        } else {
          riskLevel = 'low';
          probability = 15;
        }

        // 6. 메시지 생성
        let message = '';
        if (riskLevel === 'critical') {
          message = '🚨 오늘 Flare 발생 위험이 매우 높습니다!';
        } else if (riskLevel === 'high') {
          message = '⚠️ 오늘 Flare 발생 위험이 높습니다.';
        } else if (riskLevel === 'medium') {
          message = '⚠️ 오늘 Flare 발생 가능성이 있습니다.';
        } else {
          message = '✅ 오늘 Flare 발생 위험이 낮습니다.';
        }

        // 7. 권장 사항 통합
        const recommendations: string[] = [];
        if (symptomPrediction.riskLevel === 'high' || symptomPrediction.riskLevel === 'critical') {
          recommendations.push('전조증상이 심각합니다. 전문의 상담을 권장합니다.');
        }
        if (environmentalRisk.riskLevel === 'high' || environmentalRisk.riskLevel === 'critical') {
          recommendations.push(...environmentalRisk.recommendations);
        }
        if (lifestyleRisk.riskLevel === 'high' || lifestyleRisk.riskLevel === 'critical') {
          recommendations.push(...lifestyleRisk.recommendations);
        }
        if (recommendations.length === 0) {
          recommendations.push('현재 상태를 유지하세요.');
        }

        setFlareIndex({
          totalScore: Math.round(totalScore),
          riskLevel,
          probability,
          message,
          factors: {
            symptoms: Math.round(symptomScore),
            environment: Math.round(environmentScore),
            lifestyle: Math.round(lifestyleScore)
          },
          recommendations: [...new Set(recommendations)].slice(0, 3) // 중복 제거 및 최대 3개
        });
      } catch (error) {
        console.error('Flare 지수 계산 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateFlareIndex();
    
    // 10분마다 자동 갱신
    const interval = setInterval(calculateFlareIndex, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [diagnosisData]);

  if (loading) {
    return (
      <div className="today-flare-index loading">
        <div className="loading-spinner">⏳</div>
        <p>오늘의 Flare 지수를 계산하는 중...</p>
      </div>
    );
  }

  if (!flareIndex) {
    return null;
  }

  return (
    <div className={`today-flare-index index-${flareIndex.riskLevel}`}>
      <div className="flare-index-header">
        <h2>📊 오늘의 Flare 지수</h2>
        <div className="index-badge">
          <span className={`risk-badge risk-${flareIndex.riskLevel}`}>
            {flareIndex.riskLevel === 'critical' ? '매우 높음' :
             flareIndex.riskLevel === 'high' ? '높음' :
             flareIndex.riskLevel === 'medium' ? '보통' : '낮음'}
          </span>
        </div>
      </div>

      <div className="flare-index-main">
        <div className="index-score">
          <div className="score-circle">
            <span className="score-value">{flareIndex.totalScore}</span>
            <span className="score-unit">/100</span>
          </div>
          <div className="score-probability">
            예상 확률: <strong>{flareIndex.probability}%</strong>
          </div>
        </div>

        <div className="index-message">
          <p>{flareIndex.message}</p>
        </div>

        <div className="index-factors">
          <h4>세부 점수</h4>
          <div className="factors-grid">
            <div className="factor-item">
              <span className="factor-label">전조증상</span>
              <span className="factor-value">{flareIndex.factors.symptoms}/100</span>
            </div>
            <div className="factor-item">
              <span className="factor-label">환경 위험</span>
              <span className="factor-value">{flareIndex.factors.environment}/100</span>
            </div>
            <div className="factor-item">
              <span className="factor-label">생활습관</span>
              <span className="factor-value">{flareIndex.factors.lifestyle}/100</span>
            </div>
          </div>
        </div>

        {flareIndex.recommendations.length > 0 && (
          <div className="index-recommendations">
            <h4>권장 사항</h4>
            <ul>
              {flareIndex.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayFlareIndex;

