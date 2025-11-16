import { EmotionRecord, FlareRecord, EmotionFlareCorrelation } from '../types';

// 감정-Flare 상관 그래프 데이터 생성
export function analyzeEmotionFlareCorrelation(
  emotionRecords: EmotionRecord[],
  flareRecords: FlareRecord[],
  weekCount: number = 4
): EmotionFlareCorrelation {
  if (emotionRecords.length === 0) {
    return {
      weekData: [],
      correlation: 0,
      message: '감정 기록 데이터가 없습니다.'
    };
  }

  // 최근 N주 데이터
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weekCount * 7);

  const recentEmotions = emotionRecords.filter(e => {
    const date = new Date(e.date);
    return date >= startDate && date <= endDate;
  });

  const recentFlares = flareRecords.filter(f => {
    const date = new Date(f.date);
    return date >= startDate && date <= endDate;
  });

  // 주별 데이터 생성
  const weekData: Array<{ date: string; emotionScore: number; flareOccurred: boolean }> = [];
  
  for (let i = 0; i < weekCount; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekEmotions = recentEmotions.filter(e => {
      const date = new Date(e.date);
      return date >= weekStart && date <= weekEnd;
    });

    const weekFlares = recentFlares.filter(f => {
      const date = new Date(f.date);
      return date >= weekStart && date <= weekEnd;
    });

    // 주간 평균 감정 점수 계산
    let emotionScore = 0;
    if (weekEmotions.length > 0) {
      const avgEmotion = weekEmotions.reduce((sum, e) => {
        return sum + (
          e.emotions.depression +
          e.emotions.anxiety +
          e.emotions.stress +
          e.emotions.isolation
        ) / 4;
      }, 0) / weekEmotions.length;
      emotionScore = avgEmotion;
    }

    weekData.push({
      date: weekStart.toISOString().split('T')[0],
      emotionScore: Math.round(emotionScore * 10) / 10,
      flareOccurred: weekFlares.length > 0
    });
  }

  // 상관계수 계산
  const emotionScores = weekData.map(d => d.emotionScore);
  const flareIndicators = weekData.map(d => d.flareOccurred ? 1 : 0);

  const correlation = calculateCorrelation(emotionScores, flareIndicators);

  // 메시지 생성
  let message = '';
  if (Math.abs(correlation) > 0.5) {
    if (correlation > 0) {
      message = `감정 점수와 Flare 발생 간 강한 양의 상관관계가 있습니다 (상관계수: ${correlation.toFixed(2)}).`;
      message += '\n감정 관리가 Flare 예방에 중요합니다.';
    } else {
      message = `감정 점수와 Flare 발생 간 음의 상관관계가 있습니다 (상관계수: ${correlation.toFixed(2)}).`;
    }
  } else {
    message = `감정 점수와 Flare 발생 간의 상관계수: ${correlation.toFixed(2)}`;
    message += '\n명확한 상관관계를 찾을 수 없습니다.';
  }

  return {
    weekData,
    correlation: Math.round(correlation * 100) / 100,
    message
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

