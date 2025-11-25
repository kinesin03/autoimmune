export interface T1DInputValues {
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
  glucoseVariability: number;
  hypoFrequency: number;
  hyperFrequency: number;
  timeInRange: number;
  insulinMissedDose: number;
  ketoneWarning: number;
}

export interface T1DThresholds {
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
  glucoseVariability: number;
  hypoFrequency: number;
  hyperFrequency: number;
  timeInRange: number;
  insulinMissedDose: number;
  ketoneWarning: number;
}

export type T1DRiskLevel = 'stable' | 'caution' | 'flare';

export interface T1DContribution {
  key: keyof typeof indicatorLabels;
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface T1DAIResult {
  score: number;
  contributions: T1DContribution[];
}

const DEFAULT_THRESHOLDS: T1DThresholds = {
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
  glucoseVariability: 20,
  hypoFrequency: 0,
  hyperFrequency: 0,
  timeInRange: 70,
  insulinMissedDose: 0,
  ketoneWarning: 0
};

const indicatorLabels = {
  glucoseVariability: '혈당 변동성',
  hypoFrequency: '저혈당',
  hyperFrequency: '고혈당',
  timeInRange: '타임 인 레인지',
  fatigue: '피로감',
  sleepDisturbance: '수면장애',
  stress: '스트레스',
  anxiety: '불안감',
  depression: '우울감',
  insulinMissedDose: '인슐린 누락',
  ketoneWarning: '케톤 경고',
  appetiteLoss: '입맛저하',
  abdominalPain: '복통',
  bodyTemp: '체온',
  myalgia: '몸살',
  functionLoss: '기능저하'
} as const;

const weights: Record<keyof typeof indicatorLabels, number> = {
  glucoseVariability: 3.0,
  hypoFrequency: 3.0,
  hyperFrequency: 2.5,
  timeInRange: 2.0,
  fatigue: 1.5,
  sleepDisturbance: 1.2,
  stress: 1.0,
  anxiety: 1.0,
  depression: 1.0,
  insulinMissedDose: 0.8,
  ketoneWarning: 0.8,
  appetiteLoss: 0.5,
  abdominalPain: 0.3,
  bodyTemp: 0.3,
  myalgia: 0.3,
  functionLoss: 0.3
};

const rangeMap: Record<keyof typeof indicatorLabels, { min: number; max: number; lowerIsWorse?: boolean }> = {
  glucoseVariability: { min: 0, max: 100 },
  hypoFrequency: { min: 0, max: 10 },
  hyperFrequency: { min: 0, max: 10 },
  timeInRange: { min: 0, max: 100, lowerIsWorse: true },
  fatigue: { min: 0, max: 10 },
  sleepDisturbance: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  anxiety: { min: 0, max: 10 },
  depression: { min: 0, max: 10 },
  insulinMissedDose: { min: 0, max: 1 },
  ketoneWarning: { min: 0, max: 1 },
  appetiteLoss: { min: 0, max: 1 },
  abdominalPain: { min: 0, max: 10 },
  bodyTemp: { min: 34.5, max: 40 },
  myalgia: { min: 0, max: 10 },
  functionLoss: { min: 0, max: 10 }
};

const inputMap: Record<keyof typeof indicatorLabels, keyof T1DInputValues> = {
  glucoseVariability: 'glucoseVariability',
  hypoFrequency: 'hypoFrequency',
  hyperFrequency: 'hyperFrequency',
  timeInRange: 'timeInRange',
  fatigue: 'fatigue',
  sleepDisturbance: 'sleepDisturbance',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  insulinMissedDose: 'insulinMissedDose',
  ketoneWarning: 'ketoneWarning',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  functionLoss: 'functionLoss'
};

const thresholdMap: Record<keyof typeof indicatorLabels, keyof T1DThresholds> = {
  glucoseVariability: 'glucoseVariability',
  hypoFrequency: 'hypoFrequency',
  hyperFrequency: 'hyperFrequency',
  timeInRange: 'timeInRange',
  fatigue: 'fatigue',
  sleepDisturbance: 'sleepDisturbance',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  insulinMissedDose: 'insulinMissedDose',
  ketoneWarning: 'ketoneWarning',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  functionLoss: 'functionLoss'
};

function normalizeHigher(value: number, baseline: number, min: number, max: number): number {
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

function normalizeLower(value: number, baseline: number, min: number): number {
  if (baseline <= min) {
    baseline = min + 1e-6;
  }
  if (value >= baseline) {
    return 0;
  }
  return Math.max(0, Math.min(1, (baseline - value) / (baseline - min)));
}

export function calculateT1dFiScore(
  inputs: T1DInputValues,
  thresholds: T1DThresholds = DEFAULT_THRESHOLDS
): T1DAIResult {
  const contributions: T1DContribution[] = [];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  (Object.keys(indicatorLabels) as Array<keyof typeof indicatorLabels>).forEach((key) => {
    const value = inputs[inputMap[key]] ?? 0;
    const baseline = thresholds[thresholdMap[key]];
    const { min, max, lowerIsWorse } = rangeMap[key];

    const normalized = lowerIsWorse
      ? normalizeLower(value, baseline, min)
      : normalizeHigher(value, baseline, min, max);

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

export function classifyT1dRisk(
  score: number
): { level: T1DRiskLevel; label: string; message: string } {
  if (score < 30) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '혈당 변동성과 저·고혈당 패턴이 비교적 안정적입니다.'
    };
  }

  if (score < 60) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '혈당 변동성 혹은 저·고혈당 빈도가 증가했습니다.'
    };
  }

  return {
    level: 'flare',
    label: '고위험 flare 단계',
    message: '혈당 변동성, 저혈당/고혈당, TIR 저하가 뚜렷합니다. 의료진 상담을 권장합니다.'
  };
}

export function getDefaultT1DThresholds(): T1DThresholds {
  return { ...DEFAULT_THRESHOLDS };
}

