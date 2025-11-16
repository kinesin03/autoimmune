import {
  FlareRecord,
  StressRecord,
  FoodRecord,
  SleepRecord,
  StressCorrelation,
  FoodCorrelation,
  SleepCorrelation,
  FlareRiskAnalysis,
  FlareManagementData
} from '../types';

// 염증 유발 음식 데이터베이스
const inflammatoryFoods: { [key: string]: number } = {
  '유제품': 0.7,
  '밀가루': 0.6,
  '설탕': 0.65,
  '가공식품': 0.55,
  '튀김': 0.6,
  '알코올': 0.5,
  '인공감미료': 0.45,
  'MSG': 0.5,
  '토마토': 0.3,
  '감자': 0.25,
  '땅콩': 0.35,
  '옥수수': 0.3,
};

// 항염증 음식 데이터베이스
const antiInflammatoryFoods: string[] = [
  '연어', '고등어', '정어리', // 오메가-3
  '블루베리', '딸기', '체리', // 베리류
  '브로콜리', '시금치', '케일', // 녹색 채소
  '올리브오일', '아보카도', // 건강한 지방
  '녹차', '생강', '마늘', // 항염증 식품
];

// 스트레스 상관 분석
export function analyzeStressCorrelation(
  flares: FlareRecord[],
  stressRecords: StressRecord[]
): StressCorrelation {
  if (flares.length === 0 || stressRecords.length === 0) {
    return {
      correlation: 0,
      averageDaysToFlare: 0,
      highStressFlareCount: 0,
      message: '데이터가 부족하여 분석할 수 없습니다.'
    };
  }

  // 주 단위로 스트레스 수준 계산
  const weeklyStress: { [week: string]: number[] } = {};
  stressRecords.forEach(record => {
    const date = new Date(record.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    if (!weeklyStress[weekKey]) {
      weeklyStress[weekKey] = [];
    }
    weeklyStress[weekKey].push(record.level);
  });

  // 주별 평균 스트레스 계산
  const weeklyAvgStress: { [week: string]: number } = {};
  Object.keys(weeklyStress).forEach(week => {
    const avg = weeklyStress[week].reduce((a, b) => a + b, 0) / weeklyStress[week].length;
    weeklyAvgStress[week] = avg;
  });

  // 높은 스트레스 주 정의 (평균보다 높음)
  const allStressLevels = stressRecords.map(r => r.level);
  const avgStress = allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length;
  const highStressThreshold = avgStress;

  // Flare를 주 단위로 그룹화
  const weeklyFlares: { [week: string]: number } = {};
  flares.forEach(flare => {
    const date = new Date(flare.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyFlares[weekKey] = (weeklyFlares[weekKey] || 0) + 1;
  });

  // 높은 스트레스 주의 flare 횟수 계산
  let highStressFlareCount = 0;
  let highStressWeeks = 0;
  Object.keys(weeklyAvgStress).forEach(week => {
    if (weeklyAvgStress[week] > highStressThreshold) {
      highStressWeeks++;
      highStressFlareCount += weeklyFlares[week] || 0;
    }
  });

  // 스트레스와 flare 사이의 평균 일수 계산
  let totalDays = 0;
  let count = 0;
  flares.forEach(flare => {
    const flareDate = new Date(flare.date);
    // Flare 전 7일간의 스트레스 기록 찾기
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(flareDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const stressRecord = stressRecords.find(r => r.date === dateStr);
      if (stressRecord && stressRecord.level > highStressThreshold) {
        totalDays += i;
        count++;
        break;
      }
    }
  });

  const averageDaysToFlare = count > 0 ? totalDays / count : 0;

  // 상관계수 계산 (간단한 피어슨 상관계수)
  const stressValues: number[] = [];
  const flareValues: number[] = [];
  Object.keys(weeklyAvgStress).forEach(week => {
    stressValues.push(weeklyAvgStress[week]);
    flareValues.push(weeklyFlares[week] || 0);
  });

  const correlation = calculateCorrelation(stressValues, flareValues);

  let message = '';
  if (highStressWeeks > 0) {
    message = `스트레스 높은 주에 flare ${highStressFlareCount}회 발생`;
    if (averageDaysToFlare > 0) {
      message += `\n나의 flare는 평균적으로 스트레스 높은 날 ${Math.round(averageDaysToFlare)}일 후 발생`;
    }
  } else {
    message = '스트레스와 flare 간의 명확한 패턴을 찾을 수 없습니다.';
  }

  return {
    correlation,
    averageDaysToFlare: Math.round(averageDaysToFlare * 10) / 10,
    highStressFlareCount,
    message
  };
}

// 음식 상관 분석
export function analyzeFoodCorrelation(
  flares: FlareRecord[],
  foodRecords: FoodRecord[]
): FoodCorrelation[] {
  if (foodRecords.length === 0) {
    return [];
  }

  const foodStats: { [food: string]: { count: number; flareCount: number; hours: number[] } } = {};

  // 각 음식별 통계 수집
  foodRecords.forEach(record => {
    record.foods.forEach(food => {
      if (!foodStats[food]) {
        foodStats[food] = { count: 0, flareCount: 0, hours: [] };
      }
      foodStats[food].count++;

      // 섭취 후 증상이 있는 경우
      if (record.symptomsAfter) {
        foodStats[food].hours.push(record.symptomsAfter.hours);
      }

      // 섭취 후 48시간 내 flare 발생 여부 확인
      const recordDate = new Date(record.date + 'T' + record.time);
      const hasFlare = flares.some(flare => {
        const flareDate = new Date(flare.date);
        const hoursDiff = (flareDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60);
        return hoursDiff >= 0 && hoursDiff <= 48;
      });

      if (hasFlare) {
        foodStats[food].flareCount++;
      }
    });
  });

  // 각 음식별 상관 분석
  const correlations: FoodCorrelation[] = [];
  Object.keys(foodStats).forEach(food => {
    const stats = foodStats[food];
    const flareProbability = (stats.flareCount / stats.count) * 100;
    const avgHours = stats.hours.length > 0
      ? stats.hours.reduce((a, b) => a + b, 0) / stats.hours.length
      : 24;

    // 염증 유발 음식 데이터베이스 확인
    const inflammatoryScore = inflammatoryFoods[food] || 0;
    const isAntiInflammatory = antiInflammatoryFoods.includes(food);

    let recommendation: 'avoid' | 'moderate' | 'safe' = 'safe';
    if (flareProbability > 50 || inflammatoryScore > 0.5) {
      recommendation = 'avoid';
    } else if (flareProbability > 30 || inflammatoryScore > 0.3) {
      recommendation = 'moderate';
    } else if (isAntiInflammatory) {
      recommendation = 'safe';
    }

    let message = '';
    if (recommendation === 'avoid') {
      message = `${food} 섭취 후 ${Math.round(avgHours)}시간 내 피로도 증가 확률 ${Math.round(flareProbability)}%`;
    } else if (recommendation === 'moderate') {
      message = `${food} 섭취 시 주의가 필요합니다.`;
    } else {
      message = `${food}는 안전하게 섭취 가능합니다.`;
    }

    correlations.push({
      food,
      flareProbability: Math.round(flareProbability * 10) / 10,
      averageHoursToSymptom: Math.round(avgHours * 10) / 10,
      recommendation,
      message
    });
  });

  // Flare 빈도 감소 분석
  const recentFoods = foodRecords
    .filter(r => {
      const recordDate = new Date(r.date);
      const daysAgo = (Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    })
    .flatMap(r => r.foods);

  const avoidedFoods = Object.keys(foodStats).filter(food => {
    const recentCount = recentFoods.filter(f => f === food).length;
    const oldCount = foodStats[food].count;
    return recentCount < oldCount * 0.5; // 최근 섭취가 50% 이상 감소
  });

  if (avoidedFoods.length > 0) {
    avoidedFoods.forEach(food => {
      const correlation = correlations.find(c => c.food === food);
      if (correlation) {
        correlation.message += `\n${food} 끊은 뒤 flare 빈도 감소 추정`;
      }
    });
  }

  return correlations.sort((a, b) => b.flareProbability - a.flareProbability);
}

// 수면 상관 분석
export function analyzeSleepCorrelation(
  flares: FlareRecord[],
  sleepRecords: SleepRecord[]
): SleepCorrelation {
  if (flares.length === 0 || sleepRecords.length === 0) {
    return {
      correlation: 0,
      recommendedHours: 7.5,
      message: '데이터가 부족하여 분석할 수 없습니다.'
    };
  }

  // Flare 전후 수면 시간 수집
  const sleepHours: number[] = [];
  const flareIndicators: number[] = [];

  flares.forEach(flare => {
    const flareDate = new Date(flare.date);
    // Flare 전 3일간의 수면 기록 찾기
    for (let i = 1; i <= 3; i++) {
      const checkDate = new Date(flareDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const sleepRecord = sleepRecords.find(r => r.date === dateStr);
      if (sleepRecord) {
        sleepHours.push(sleepRecord.totalHours);
        flareIndicators.push(1); // Flare 발생
      }
    }
  });

  // Flare 없는 날의 수면 시간
  const allSleepHours = sleepRecords.map(r => r.totalHours);
  const avgSleepHours = allSleepHours.reduce((a, b) => a + b, 0) / allSleepHours.length;

  // 상관계수 계산
  const correlation = sleepHours.length > 0
    ? calculateCorrelation(sleepHours, flareIndicators)
    : 0;

  // 권장 수면 시간 (평균보다 약간 많게)
  const recommendedHours = Math.max(7.5, avgSleepHours + 0.5);

  let message = '';
  if (Math.abs(correlation) > 0.5) {
    message = `수면시간의 상관계수: ${correlation.toFixed(2)}`;
    if (correlation < 0) {
      message += '\n수면 시간이 부족할수록 flare 발생 가능성이 높습니다.';
    }
  } else {
    message = `수면시간의 상관계수: ${correlation.toFixed(2)}\n수면과 flare 간의 명확한 상관관계를 찾을 수 없습니다.`;
  }

  return {
    correlation: Math.round(correlation * 100) / 100,
    recommendedHours: Math.round(recommendedHours * 10) / 10,
    message
  };
}

// 통합 분석 및 Flare 위험 평가
export function analyzeFlareRisk(
  data: FlareManagementData
): FlareRiskAnalysis {
  const riskFactors: string[] = [];
  let riskScore = 0;
  const factors = {
    stress: false,
    food: false,
    sleep: false
  };

  // 최근 3일간의 데이터 확인
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  // 스트레스 분석
  const recentStress = data.stressRecords
    .filter(r => r.date >= threeDaysAgoStr)
    .map(r => r.level);
  if (recentStress.length > 0) {
    const avgStress = recentStress.reduce((a, b) => a + b, 0) / recentStress.length;
    if (avgStress > 7) {
      factors.stress = true;
      riskScore += 30;
      riskFactors.push('높은 스트레스 수준');
    }
  }

  // 수면 분석
  const recentSleep = data.sleepRecords
    .filter(r => r.date >= threeDaysAgoStr)
    .map(r => r.totalHours);
  if (recentSleep.length > 0) {
    const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
    if (data.sleepCorrelation && avgSleep < data.sleepCorrelation.recommendedHours - 1) {
      factors.sleep = true;
      riskScore += 25;
      riskFactors.push('수면 부족');
    }
  }

  // 음식 분석
  const recentFoods = data.foodRecords
    .filter(r => r.date >= threeDaysAgoStr)
    .flatMap(r => r.foods);
  
  const riskyFoods = data.foodCorrelations
    .filter(c => c.recommendation === 'avoid' && recentFoods.includes(c.food));
  
  if (riskyFoods.length > 0) {
    factors.food = true;
    riskScore += 25;
    riskFactors.push(`위험 음식 섭취: ${riskyFoods.map(f => f.food).join(', ')}`);
  }

  // 이전 Flare 패턴과 비교
  if (data.flares.length >= 2) {
    const lastFlare = data.flares[data.flares.length - 1];
    const lastFlareDate = new Date(lastFlare.date);
    
    // 마지막 Flare 전 3일간의 패턴 확인
    const beforeLastFlare: { stress?: number; sleep?: number; foods?: string[] } = {};
    
    for (let i = 1; i <= 3; i++) {
      const checkDate = new Date(lastFlareDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const stress = data.stressRecords.find(r => r.date === dateStr);
      if (stress && !beforeLastFlare.stress) {
        beforeLastFlare.stress = stress.level;
      }
      
      const sleep = data.sleepRecords.find(r => r.date === dateStr);
      if (sleep && !beforeLastFlare.sleep) {
        beforeLastFlare.sleep = sleep.totalHours;
      }
      
      const foods = data.foodRecords
        .filter(r => r.date === dateStr)
        .flatMap(r => r.foods);
      if (foods.length > 0) {
        beforeLastFlare.foods = foods;
      }
    }

    // 현재 패턴과 비교
    const currentStress = recentStress.length > 0
      ? recentStress.reduce((a, b) => a + b, 0) / recentStress.length
      : 0;
    const currentSleep = recentSleep.length > 0
      ? recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length
      : 0;
    const currentFoods = recentFoods;

    let patternMatch = 0;
    if (beforeLastFlare.stress && Math.abs(currentStress - beforeLastFlare.stress) < 1) {
      patternMatch++;
    }
    if (beforeLastFlare.sleep && Math.abs(currentSleep - beforeLastFlare.sleep) < 1) {
      patternMatch++;
    }
    if (beforeLastFlare.foods && currentFoods.some(f => beforeLastFlare.foods!.includes(f))) {
      patternMatch++;
    }

    if (patternMatch >= 2) {
      riskScore += 20;
      riskFactors.push('이전 flare 전과 유사한 패턴 감지');
    }
  }

  // 위험 수준 결정
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // 메시지 생성
  let message = '';
  if (riskLevel === 'critical' || riskLevel === 'high') {
    message = '⚠️ Flare 발생 가능성이 높습니다!';
    if (riskFactors.length > 0) {
      message += '\n' + riskFactors.join(', ');
    }
    if (riskFactors.some(f => f.includes('유사한 패턴'))) {
      message += '\n지난번 flare 전과 유사한 패턴입니다.';
    }
  } else if (riskLevel === 'medium') {
    message = '⚠️ Flare 발생 가능성이 있습니다.';
    if (riskFactors.length > 0) {
      message += '\n' + riskFactors.join(', ');
    }
  } else {
    message = '✅ 현재 Flare 발생 위험이 낮습니다.';
  }

  // 권장 사항 생성
  const recommendations: string[] = [];
  if (factors.stress) {
    recommendations.push('스트레스 관리 방법을 실천하세요 (명상, 운동, 휴식)');
  }
  if (factors.sleep) {
    recommendations.push(`수면 시간을 ${data.sleepCorrelation?.recommendedHours || 7.5}시간 이상 확보하세요`);
  }
  if (factors.food) {
    const avoidFoods = riskyFoods.map(f => f.food).join(', ');
    recommendations.push(`다음 음식 섭취를 피하세요: ${avoidFoods}`);
    recommendations.push('항염증 음식을 섭취하세요 (연어, 블루베리, 브로콜리 등)');
  }
  if (recommendations.length === 0) {
    recommendations.push('현재 상태를 유지하세요');
  }

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    factors,
    message,
    recommendations
  };
}

// 유틸리티 함수들
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

