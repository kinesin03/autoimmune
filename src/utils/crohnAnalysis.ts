export interface CrohnInputValues {
  fatigue: number;
  bodyTemp: number;
  myalgia: number;
  anxiety: number;
  depression: number;
  stress: number;
  sleepDisturbance: number;
  appetiteLoss: number;
  abdominalPain: number;
  jointPain: number;
  functionLoss: number;
  skinPain: number;
  itchiness: number;
  stoolFrequency: number;
  stoolLooseness: number;
  bloodMucus: number;
  urgency: number;
  bloating: number;
}

export interface CrohnThresholds {
  fatigue: number;
  bodyTemp: number;
  myalgia: number;
  anxiety: number;
  depression: number;
  stress: number;
  sleepDisturbance: number;
  appetiteLoss: number;
  abdominalPain: number;
  jointPain: number;
  functionLoss: number;
  skinPain: number;
  itchiness: number;
  stoolFrequency: number;
  stoolLooseness: number;
  bloodMucus: number;
  urgency: number;
  bloating: number;
}

export type CrohnRiskLevel = 'stable' | 'caution' | 'flare';

export interface CrohnContribution {
  key: keyof typeof indicatorLabels;
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface CrohnAIResult {
  score: number;
  contributions: CrohnContribution[];
}

const DEFAULT_THRESHOLDS: CrohnThresholds = {
  fatigue: 5,
  bodyTemp: 37,
  myalgia: 3,
  anxiety: 4,
  depression: 4,
  stress: 5,
  sleepDisturbance: 4,
  appetiteLoss: 0,
  abdominalPain: 3,
  jointPain: 2,
  functionLoss: 3,
  skinPain: 2,
  itchiness: 2,
  stoolFrequency: 3,
  stoolLooseness: 3,
  bloodMucus: 0,
  urgency: 3,
  bloating: 2
};

const indicatorLabels = {
  stoolFrequency: '배변 횟수',
  abdominalPain: '복통',
  stoolLooseness: '묽은 정도',
  urgency: '배변 급박감',
  bloodMucus: '혈변/점액질',
  fatigue: '피로감',
  bloating: '복부팽만',
  stress: '스트레스',
  anxiety: '불안감',
  depression: '우울감',
  sleepDisturbance: '수면장애',
  bodyTemp: '체온 이상',
  myalgia: '몸살',
  appetiteLoss: '입맛저하',
  jointPain: '관절통',
  skinPain: '피부 통증',
  itchiness: '가려움'
} as const;

const weights: Record<keyof typeof indicatorLabels, number> = {
  stoolFrequency: 3.0,
  abdominalPain: 3.0,
  stoolLooseness: 2.5,
  urgency: 2.0,
  bloodMucus: 2.0,
  fatigue: 1.5,
  bloating: 1.0,
  stress: 0.7,
  anxiety: 0.7,
  depression: 0.7,
  sleepDisturbance: 0.7,
  bodyTemp: 0.3,
  myalgia: 0.3,
  appetiteLoss: 0.3,
  jointPain: 0.2,
  skinPain: 0.2,
  itchiness: 0.2
};

const rangeMap: Record<keyof typeof indicatorLabels, { min: number; max: number }> = {
  stoolFrequency: { min: 0, max: 20 },
  abdominalPain: { min: 0, max: 10 },
  stoolLooseness: { min: 0, max: 10 },
  urgency: { min: 0, max: 10 },
  bloodMucus: { min: 0, max: 1 },
  fatigue: { min: 0, max: 10 },
  bloating: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  anxiety: { min: 0, max: 10 },
  depression: { min: 0, max: 10 },
  sleepDisturbance: { min: 0, max: 10 },
  bodyTemp: { min: 34.5, max: 40 },
  myalgia: { min: 0, max: 10 },
  appetiteLoss: { min: 0, max: 1 },
  jointPain: { min: 0, max: 10 },
  skinPain: { min: 0, max: 10 },
  itchiness: { min: 0, max: 10 }
};

const inputKeyMap: Record<keyof typeof indicatorLabels, keyof CrohnInputValues> = {
  stoolFrequency: 'stoolFrequency',
  abdominalPain: 'abdominalPain',
  stoolLooseness: 'stoolLooseness',
  urgency: 'urgency',
  bloodMucus: 'bloodMucus',
  fatigue: 'fatigue',
  bloating: 'bloating',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  sleepDisturbance: 'sleepDisturbance',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  appetiteLoss: 'appetiteLoss',
  jointPain: 'jointPain',
  skinPain: 'skinPain',
  itchiness: 'itchiness'
};

const thresholdMap: Record<keyof typeof indicatorLabels, keyof CrohnThresholds> = {
  stoolFrequency: 'stoolFrequency',
  abdominalPain: 'abdominalPain',
  stoolLooseness: 'stoolLooseness',
  urgency: 'urgency',
  bloodMucus: 'bloodMucus',
  fatigue: 'fatigue',
  bloating: 'bloating',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  sleepDisturbance: 'sleepDisturbance',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  appetiteLoss: 'appetiteLoss',
  jointPain: 'jointPain',
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

export function calculateCfiScore(
  inputs: CrohnInputValues,
  thresholds: CrohnThresholds = DEFAULT_THRESHOLDS
): CrohnAIResult {
  const contributions: CrohnContribution[] = [];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  (Object.keys(indicatorLabels) as Array<keyof typeof indicatorLabels>).forEach((key) => {
    const value = inputs[inputKeyMap[key]] ?? 0;
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

export function classifyCfiRisk(
  score: number
): { level: CrohnRiskLevel; label: string; message: string } {
  if (score < 30) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '배변/복통 변동이 크지 않습니다.'
    };
  }

  if (score < 60) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '배변, 복통, 급박감이 증가한 신호가 있습니다.'
    };
  }

  return {
    level: 'flare',
    label: '고위험 flare 단계',
    message: '설사·복통·점액/혈변이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.'
  };
}

export function getDefaultCrohnThresholds(): CrohnThresholds {
  return { ...DEFAULT_THRESHOLDS };
}

