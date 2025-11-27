// 자가면역성 갑상선 질환 AI 분석 유틸리티

export interface ThyroidInputValues {
  // Hyperthyroid core symptoms
  restingHeartRate: number;     // 안정 시 심박수 (40-160 bpm)
  tremorSeverity: number;       // 떨림 정도 (0-10)
  heatIntolerance: number;       // 열 불편감 / 더위 못참음 (0-10)
  weightLoss: number;            // 최근 체중 감소량 (0-10 kg 정도 스케일)
  
  // 공통 전신/정신 변수
  fatigue: number;               // 피로감 (0-10)
  bodyTemp: number;              // 체온 (34.5-40.0 ℃)
  myalgia: number;               // 몸살/근육통 (0-10)
  anxiety: number;                // 불안 (0-10)
  depression: number;            // 우울 (0-10)
  stress: number;                // 스트레스 (0-10)
  sleepDisturbance: number;      // 수면 장애 (0-10)
  appetiteLoss: number;          // 입맛 저하 (0 or 1)
  abdominalPain: number;         // 복통 (0-10)
  functionLoss: number;          // 일상 기능 저하 (0-10)
}

export interface ThyroidThresholds {
  restingHeartRate: number;
  tremorSeverity: number;
  heatIntolerance: number;
  weightLoss: number;
  fatigue: number;
  bodyTemp: number;
  myalgia: number;
  anxiety: number;
  depression: number;
  stress: number;
  sleepDisturbance: number;
  appetiteLoss: number;
  abdominalPain: number;
  functionLoss: number;
}

export function getDefaultThyroidThresholds(): ThyroidThresholds {
  return {
    restingHeartRate: 90.0,
    tremorSeverity: 2.0,
    heatIntolerance: 3.0,
    weightLoss: 1.0,
    fatigue: 5.0,
    bodyTemp: 37.0,
    myalgia: 3.0,
    anxiety: 4.0,
    depression: 4.0,
    stress: 5.0,
    sleepDisturbance: 4.0,
    appetiteLoss: 0,
    abdominalPain: 2.0,
    functionLoss: 3.0,
  };
}

function normalize(value: number, baseline: number, vmin: number, vmax: number): number {
  // binary(0/1) 처리
  if (vmin === 0.0 && vmax === 1.0) {
    return value > baseline ? 1.0 : 0.0;
  }

  if (baseline >= vmax) {
    baseline = vmax - 1e-6;
  }

  if (value <= baseline) {
    return 0.0;
  }

  return Math.min(1.0, Math.max(0.0, (value - baseline) / (vmax - baseline)));
}

export function calculateThfiScore(
  inputs: ThyroidInputValues,
  thresholds?: ThyroidThresholds
): number {
  if (!thresholds) {
    thresholds = getDefaultThyroidThresholds();
  }

  const X: Record<string, number> = {};

  // hyperthyroid core symptoms
  X.restingHeartRate = normalize(inputs.restingHeartRate, thresholds.restingHeartRate, 40, 160);
  X.tremorSeverity = normalize(inputs.tremorSeverity, thresholds.tremorSeverity, 0, 10);
  X.heatIntolerance = normalize(inputs.heatIntolerance, thresholds.heatIntolerance, 0, 10);
  X.weightLoss = normalize(inputs.weightLoss, thresholds.weightLoss, 0, 10);

  // 공통 전신/정신 변수
  X.fatigue = normalize(inputs.fatigue, thresholds.fatigue, 0, 10);
  X.bodyTemp = normalize(inputs.bodyTemp, thresholds.bodyTemp, 34.5, 40);
  X.myalgia = normalize(inputs.myalgia, thresholds.myalgia, 0, 10);
  X.anxiety = normalize(inputs.anxiety, thresholds.anxiety, 0, 10);
  X.depression = normalize(inputs.depression, thresholds.depression, 0, 10);
  X.stress = normalize(inputs.stress, thresholds.stress, 0, 10);
  X.sleepDisturbance = normalize(inputs.sleepDisturbance, thresholds.sleepDisturbance, 0, 10);
  X.appetiteLoss = normalize(inputs.appetiteLoss, thresholds.appetiteLoss, 0, 1);
  X.abdominalPain = normalize(inputs.abdominalPain, thresholds.abdominalPain, 0, 10);
  X.functionLoss = normalize(inputs.functionLoss, thresholds.functionLoss, 0, 10);

  // 가중치 (문헌 + 병태생리 기반)
  const weights: Record<string, number> = {
    // Level 1 — thyrotoxicosis core
    restingHeartRate: 3.0,
    tremorSeverity: 2.5,
    heatIntolerance: 2.0,
    weightLoss: 2.0,
    
    // Level 2 — hypermetabolic / 수면·피로 도메인
    fatigue: 1.5,
    sleepDisturbance: 1.5,
    anxiety: 1.2,
    functionLoss: 1.0,
    stress: 1.0,
    
    // Level 3 — 비특이적 전신/정신 신호
    bodyTemp: 0.8,
    depression: 0.8,
    myalgia: 0.3,
    abdominalPain: 0.3,
    appetiteLoss: 0.3,
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const weightedSum = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + weight * (X[key] || 0),
    0
  );

  const score = (100 * weightedSum) / totalWeight;
  return Math.max(0.0, Math.min(100.0, score));
}

export function classifyThfiRisk(score: number): string {
  if (score < 30) {
    return '안정 단계: 현재로서는 갑상선 항진 증상의 뚜렷한 악화가 크지 않습니다.';
  } else if (score < 60) {
    return '주의 단계: 심박수, 떨림, 열 불편감 또는 체중 변동이 평소보다 증가한 신호가 있습니다.';
  } else {
    return '고위험 flare 단계: 심박·떨림·체중감소 등 갑상선 항진 증상이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.';
  }
}

export function getThyroidDrivers(
  inputs: ThyroidInputValues,
  thresholds?: ThyroidThresholds
): Array<{ name: string; contribution: number }> {
  if (!thresholds) {
    thresholds = getDefaultThyroidThresholds();
  }

  const X: Record<string, number> = {};
  X.restingHeartRate = normalize(inputs.restingHeartRate, thresholds.restingHeartRate, 40, 160);
  X.tremorSeverity = normalize(inputs.tremorSeverity, thresholds.tremorSeverity, 0, 10);
  X.heatIntolerance = normalize(inputs.heatIntolerance, thresholds.heatIntolerance, 0, 10);
  X.weightLoss = normalize(inputs.weightLoss, thresholds.weightLoss, 0, 10);
  X.fatigue = normalize(inputs.fatigue, thresholds.fatigue, 0, 10);
  X.bodyTemp = normalize(inputs.bodyTemp, thresholds.bodyTemp, 34.5, 40);
  X.myalgia = normalize(inputs.myalgia, thresholds.myalgia, 0, 10);
  X.anxiety = normalize(inputs.anxiety, thresholds.anxiety, 0, 10);
  X.depression = normalize(inputs.depression, thresholds.depression, 0, 10);
  X.stress = normalize(inputs.stress, thresholds.stress, 0, 10);
  X.sleepDisturbance = normalize(inputs.sleepDisturbance, thresholds.sleepDisturbance, 0, 10);
  X.appetiteLoss = normalize(inputs.appetiteLoss, thresholds.appetiteLoss, 0, 1);
  X.abdominalPain = normalize(inputs.abdominalPain, thresholds.abdominalPain, 0, 10);
  X.functionLoss = normalize(inputs.functionLoss, thresholds.functionLoss, 0, 10);

  const weights: Record<string, number> = {
    restingHeartRate: 3.0,
    tremorSeverity: 2.5,
    heatIntolerance: 2.0,
    weightLoss: 2.0,
    fatigue: 1.5,
    sleepDisturbance: 1.5,
    anxiety: 1.2,
    functionLoss: 1.0,
    stress: 1.0,
    bodyTemp: 0.8,
    depression: 0.8,
    myalgia: 0.3,
    abdominalPain: 0.3,
    appetiteLoss: 0.3,
  };

  const nameMap: Record<string, string> = {
    restingHeartRate: '안정 시 심박수',
    tremorSeverity: '떨림 정도',
    heatIntolerance: '열 불편감',
    weightLoss: '체중 감소',
    fatigue: '피로감',
    bodyTemp: '체온',
    myalgia: '몸살',
    anxiety: '불안감',
    depression: '우울감',
    stress: '스트레스',
    sleepDisturbance: '수면 장애',
    appetiteLoss: '입맛 저하',
    abdominalPain: '복통',
    functionLoss: '기능 저하',
  };

  const drivers = Object.entries(weights)
    .map(([key, weight]) => ({
      name: nameMap[key] || key,
      contribution: weight * (X[key] || 0),
    }))
    .filter((d) => d.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  const maxContribution = Math.max(...drivers.map((d) => d.contribution), 1);
  return drivers.map((d) => ({
    name: d.name,
    contribution: Math.round((d.contribution / maxContribution) * 100),
  }));
}




