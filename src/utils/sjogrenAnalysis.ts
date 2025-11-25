// 쇼그렌 증후군 AI 분석 유틸리티

export interface SjogrenInputValues {
  // 공통 flare 변수
  fatigue: number;               // 피로 (0-10)
  stress: number;                // 스트레스 (0-10)
  anxiety: number;               // 불안 (0-10)
  depression: number;            // 우울 (0-10)
  sleepDisturbance: number;      // 수면 장애 (0-10)
  abdominalPain: number;         // 복통 (0-10)
  appetiteLoss: number;          // 입맛 저하 (0 or 1)
  functionLoss: number;          // 기능 저하 (0-10)
  skinPain: number;              // 피부 통증 (0-10)
  itchiness: number;             // 가려움 (0-10)
  
  // 쇼그렌 전용 핵심 dryness 변수
  oralDryness: number;           // 구강 건조 (0-10)
  ocularDryness: number;         // 안구 건조 (0-10)
}

export interface SjogrenThresholds {
  fatigue: number;
  stress: number;
  anxiety: number;
  depression: number;
  sleepDisturbance: number;
  abdominalPain: number;
  appetiteLoss: number;
  functionLoss: number;
  skinPain: number;
  itchiness: number;
  oralDryness: number;
  ocularDryness: number;
}

export function getDefaultSjogrenThresholds(): SjogrenThresholds {
  return {
    fatigue: 5.0,
    stress: 5.0,
    anxiety: 4.0,
    depression: 4.0,
    sleepDisturbance: 4.0,
    abdominalPain: 2.0,
    appetiteLoss: 0,
    functionLoss: 3.0,
    skinPain: 2.0,
    itchiness: 2.0,
    oralDryness: 3.0,
    ocularDryness: 3.0,
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

export function calculateSsiScore(
  inputs: SjogrenInputValues,
  thresholds?: SjogrenThresholds
): number {
  if (!thresholds) {
    thresholds = getDefaultSjogrenThresholds();
  }

  const X: Record<string, number> = {};

  // 공통 flare 변수
  X.fatigue = normalize(inputs.fatigue, thresholds.fatigue, 0, 10);
  X.stress = normalize(inputs.stress, thresholds.stress, 0, 10);
  X.anxiety = normalize(inputs.anxiety, thresholds.anxiety, 0, 10);
  X.depression = normalize(inputs.depression, thresholds.depression, 0, 10);
  X.sleepDisturbance = normalize(inputs.sleepDisturbance, thresholds.sleepDisturbance, 0, 10);
  X.abdominalPain = normalize(inputs.abdominalPain, thresholds.abdominalPain, 0, 10);
  X.appetiteLoss = normalize(inputs.appetiteLoss, thresholds.appetiteLoss, 0, 1);
  X.functionLoss = normalize(inputs.functionLoss, thresholds.functionLoss, 0, 10);
  X.skinPain = normalize(inputs.skinPain, thresholds.skinPain, 0, 10);
  X.itchiness = normalize(inputs.itchiness, thresholds.itchiness, 0, 10);

  // 쇼그렌 핵심 dryness 변수
  X.oralDryness = normalize(inputs.oralDryness, thresholds.oralDryness, 0, 10);
  X.ocularDryness = normalize(inputs.ocularDryness, thresholds.ocularDryness, 0, 10);

  // 가중치 (논문 기반)
  const weights: Record<string, number> = {
    // Level 1 — 핵심 dryness (ESSPRI 핵심 중 핵심)
    oralDryness: 3.0,
    ocularDryness: 3.0,
    
    // Level 2 — PROM 핵심 cluster (fatigue-pain-sleep)
    fatigue: 2.5,
    skinPain: 2.0,
    itchiness: 2.0,
    sleepDisturbance: 1.5,
    functionLoss: 1.2,
    
    // Level 3 — Mental burden
    stress: 1.0,
    anxiety: 1.0,
    depression: 1.0,
    
    // Level 4 — 비특이적 systemic burden
    abdominalPain: 0.5,
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

export function classifySsiRisk(score: number): string {
  if (score < 30) {
    return '안정 단계: 건조·피로·통증 등이 기준선과 크게 다르지 않습니다.';
  } else if (score < 60) {
    return '주의 단계: 건조감 또는 피로·통증·가려움 등이 평소보다 증가했습니다.';
  } else {
    return '고위험 flare 단계: 건조 + 피로/통증 cluster가 뚜렷하게 악화되었습니다. 의료진 상담 권장합니다.';
  }
}

export function getSjogrenDrivers(
  inputs: SjogrenInputValues,
  thresholds?: SjogrenThresholds
): Array<{ name: string; contribution: number }> {
  if (!thresholds) {
    thresholds = getDefaultSjogrenThresholds();
  }

  const X: Record<string, number> = {};
  X.fatigue = normalize(inputs.fatigue, thresholds.fatigue, 0, 10);
  X.stress = normalize(inputs.stress, thresholds.stress, 0, 10);
  X.anxiety = normalize(inputs.anxiety, thresholds.anxiety, 0, 10);
  X.depression = normalize(inputs.depression, thresholds.depression, 0, 10);
  X.sleepDisturbance = normalize(inputs.sleepDisturbance, thresholds.sleepDisturbance, 0, 10);
  X.abdominalPain = normalize(inputs.abdominalPain, thresholds.abdominalPain, 0, 10);
  X.appetiteLoss = normalize(inputs.appetiteLoss, thresholds.appetiteLoss, 0, 1);
  X.functionLoss = normalize(inputs.functionLoss, thresholds.functionLoss, 0, 10);
  X.skinPain = normalize(inputs.skinPain, thresholds.skinPain, 0, 10);
  X.itchiness = normalize(inputs.itchiness, thresholds.itchiness, 0, 10);
  X.oralDryness = normalize(inputs.oralDryness, thresholds.oralDryness, 0, 10);
  X.ocularDryness = normalize(inputs.ocularDryness, thresholds.ocularDryness, 0, 10);

  const weights: Record<string, number> = {
    oralDryness: 3.0,
    ocularDryness: 3.0,
    fatigue: 2.5,
    skinPain: 2.0,
    itchiness: 2.0,
    sleepDisturbance: 1.5,
    functionLoss: 1.2,
    stress: 1.0,
    anxiety: 1.0,
    depression: 1.0,
    abdominalPain: 0.5,
    appetiteLoss: 0.3,
  };

  const nameMap: Record<string, string> = {
    oralDryness: '구강 건조',
    ocularDryness: '안구 건조',
    fatigue: '피로감',
    skinPain: '피부 통증',
    itchiness: '가려움',
    sleepDisturbance: '수면 장애',
    functionLoss: '기능 저하',
    stress: '스트레스',
    anxiety: '불안감',
    depression: '우울감',
    abdominalPain: '복통',
    appetiteLoss: '입맛 저하',
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

