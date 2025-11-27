export interface MSInputValues {
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
  skinPain: number;
  itchiness: number;
  visionBlur: number;
  sensoryLoss: number;
  balanceImpairment: number;
  walkingScore: number;
}

export interface MSThresholds {
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
  skinPain: number;
  itchiness: number;
  visionBlur: number;
  sensoryLoss: number;
  balanceImpairment: number;
  walkingScore: number;
}

export type MSRiskLevel = 'stable' | 'caution' | 'flare';

export interface MSContribution {
  key: keyof typeof indicatorLabels;
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface MSAIResult {
  score: number;
  contributions: MSContribution[];
}

const DEFAULT_THRESHOLDS: MSThresholds = {
  fatigue: 5,
  bodyTemp: 37,
  myalgia: 3,
  anxiety: 4,
  depression: 4,
  stress: 5,
  sleepDisturbance: 4,
  appetiteLoss: 0,
  abdominalPain: 2,
  functionLoss: 3,
  skinPain: 2,
  itchiness: 2,
  visionBlur: 0,
  sensoryLoss: 2,
  balanceImpairment: 2,
  walkingScore: 2
};

const indicatorLabels = {
  walkingScore: '보행 장애',
  visionBlur: '시야 흐림',
  sensoryLoss: '감각 둔화',
  balanceImpairment: '균형 장애',
  fatigue: '피로감',
  functionLoss: '기능저하',
  stress: '스트레스',
  anxiety: '불안감',
  depression: '우울감',
  sleepDisturbance: '수면 장애',
  bodyTemp: '체온 이상',
  myalgia: '몸살',
  appetiteLoss: '입맛저하',
  abdominalPain: '복통',
  skinPain: '피부 통증',
  itchiness: '가려움'
} as const;

const weights: Record<keyof typeof indicatorLabels, number> = {
  walkingScore: 3.0,
  visionBlur: 2.5,
  sensoryLoss: 2.0,
  balanceImpairment: 2.0,
  fatigue: 2.0,
  functionLoss: 1.2,
  stress: 0.8,
  anxiety: 0.8,
  depression: 0.8,
  sleepDisturbance: 0.7,
  bodyTemp: 0.3,
  myalgia: 0.3,
  appetiteLoss: 0.3,
  abdominalPain: 0.3,
  skinPain: 0.2,
  itchiness: 0.2
};

const rangeMap: Record<keyof typeof indicatorLabels, { min: number; max: number }> = {
  walkingScore: { min: 0, max: 10 },
  visionBlur: { min: 0, max: 1 },
  sensoryLoss: { min: 0, max: 10 },
  balanceImpairment: { min: 0, max: 10 },
  fatigue: { min: 0, max: 10 },
  functionLoss: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  anxiety: { min: 0, max: 10 },
  depression: { min: 0, max: 10 },
  sleepDisturbance: { min: 0, max: 10 },
  bodyTemp: { min: 34.5, max: 40 },
  myalgia: { min: 0, max: 10 },
  appetiteLoss: { min: 0, max: 1 },
  abdominalPain: { min: 0, max: 10 },
  skinPain: { min: 0, max: 10 },
  itchiness: { min: 0, max: 10 }
};

const inputMap: Record<keyof typeof indicatorLabels, keyof MSInputValues> = {
  walkingScore: 'walkingScore',
  visionBlur: 'visionBlur',
  sensoryLoss: 'sensoryLoss',
  balanceImpairment: 'balanceImpairment',
  fatigue: 'fatigue',
  functionLoss: 'functionLoss',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  sleepDisturbance: 'sleepDisturbance',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  skinPain: 'skinPain',
  itchiness: 'itchiness'
};

const thresholdMap: Record<keyof typeof indicatorLabels, keyof MSThresholds> = {
  walkingScore: 'walkingScore',
  visionBlur: 'visionBlur',
  sensoryLoss: 'sensoryLoss',
  balanceImpairment: 'balanceImpairment',
  fatigue: 'fatigue',
  functionLoss: 'functionLoss',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  sleepDisturbance: 'sleepDisturbance',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  skinPain: 'skinPain',
  itchiness: 'itchiness'
};

function normalize(value: number, baseline: number, min: number, max: number): number {
  if (min === 0 && max === 1) {
    return value > baseline ? 1 : 0;
  }
  if (baseline >= max) {
    baseline = max - 1e-6;
  }
  if (value <= baseline) {
    return 0;
  }
  return Math.max(0, Math.min(1, (value - baseline) / (max - baseline)));
}

export function calculateMsFiScore(
  inputs: MSInputValues,
  thresholds: MSThresholds = DEFAULT_THRESHOLDS
): MSAIResult {
  const contributions: MSContribution[] = [];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  (Object.keys(indicatorLabels) as Array<keyof typeof indicatorLabels>).forEach((key) => {
    const value = inputs[inputMap[key]] ?? 0;
    const baseline = thresholds[thresholdMap[key]];
    const { min, max } = rangeMap[key];

    const normalized = normalize(value, baseline, min, max);
    const contribution = normalized * weights[key];
    weightedSum += contribution;

    contributions.push({
      key,
      label: indicatorLabels[key],
      normalized,
      weight: weights[key],
      contribution
    });
  });

  const score = Math.max(0, Math.min(100, (weightedSum / totalWeight) * 100));

  return {
    score,
    contributions: contributions.sort((a, b) => b.contribution - a.contribution)
  };
}

export function classifyMsRisk(
  score: number
): { level: MSRiskLevel; label: string; message: string } {
  if (score < 30) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '신경학적 악화의 뚜렷한 증거가 많지 않습니다.'
    };
  }

  if (score < 60) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '보행·감각·시야·균형 중 일부 악화가 감지되었습니다.'
    };
  }

  return {
    level: 'flare',
      label: '고위험 flare 단계',
      message: '시야/감각/균형/보행 증상이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.'
  };
}

export function getDefaultMsThresholds(): MSThresholds {
  return { ...DEFAULT_THRESHOLDS };
}




