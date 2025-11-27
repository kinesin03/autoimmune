export interface PsoriasisInputValues {
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
  erythema: number;
  skinThickness: number;
  scaling: number;
}

export interface PsoriasisThresholds {
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
  erythema: number;
  skinThickness: number;
  scaling: number;
}

export interface PsoriasisContribution {
  key: keyof typeof indicatorLabels;
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface PsoriasisAIResult {
  score: number;
  contributions: PsoriasisContribution[];
}

export type PsoriasisRiskLevel = 'stable' | 'caution' | 'flare';

const DEFAULT_THRESHOLDS: PsoriasisThresholds = {
  fatigue: 5,
  bodyTemp: 37,
  myalgia: 3,
  anxiety: 4,
  depression: 4,
  stress: 5,
  sleepDisturbance: 4,
  appetiteLoss: 0,
  abdominalPain: 2,
  jointPain: 2,
  functionLoss: 3,
  skinPain: 2,
  itchiness: 3,
  erythema: 3,
  skinThickness: 3,
  scaling: 0
};

const indicatorLabels = {
  itchiness: '가려움',
  erythema: '붉은기',
  skinThickness: '피부 두께',
  scaling: '인설/각질',
  skinPain: '피부 통증',
  functionLoss: '기능저하',
  sleepDisturbance: '수면장애',
  stress: '스트레스',
  anxiety: '불안감',
  depression: '우울감',
  fatigue: '피로감',
  myalgia: '몸살/근육통',
  bodyTemp: '체온 이상',
  abdominalPain: '복통',
  appetiteLoss: '입맛저하',
  jointPain: '관절통'
} as const;

const weights: Record<keyof typeof indicatorLabels, number> = {
  itchiness: 3.0,
  erythema: 3.0,
  skinThickness: 2.5,
  scaling: 2.0,
  skinPain: 2.0,
  functionLoss: 1.5,
  sleepDisturbance: 1.2,
  stress: 0.8,
  anxiety: 0.8,
  depression: 0.8,
  fatigue: 0.5,
  myalgia: 0.3,
  bodyTemp: 0.3,
  abdominalPain: 0.2,
  appetiteLoss: 0.2,
  jointPain: 0.2
};

const rangeMap: Record<keyof typeof indicatorLabels, { min: number; max: number }> = {
  itchiness: { min: 0, max: 10 },
  erythema: { min: 0, max: 10 },
  skinThickness: { min: 0, max: 10 },
  scaling: { min: 0, max: 1 },
  skinPain: { min: 0, max: 10 },
  functionLoss: { min: 0, max: 10 },
  sleepDisturbance: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  anxiety: { min: 0, max: 10 },
  depression: { min: 0, max: 10 },
  fatigue: { min: 0, max: 10 },
  myalgia: { min: 0, max: 10 },
  bodyTemp: { min: 34.5, max: 40 },
  abdominalPain: { min: 0, max: 10 },
  appetiteLoss: { min: 0, max: 1 },
  jointPain: { min: 0, max: 10 }
};

const inputKeyMap: Record<keyof typeof indicatorLabels, keyof PsoriasisInputValues> = {
  itchiness: 'itchiness',
  erythema: 'erythema',
  skinThickness: 'skinThickness',
  scaling: 'scaling',
  skinPain: 'skinPain',
  functionLoss: 'functionLoss',
  sleepDisturbance: 'sleepDisturbance',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  fatigue: 'fatigue',
  myalgia: 'myalgia',
  bodyTemp: 'bodyTemp',
  abdominalPain: 'abdominalPain',
  appetiteLoss: 'appetiteLoss',
  jointPain: 'jointPain'
};

const thresholdKeyMap: Record<keyof typeof indicatorLabels, keyof PsoriasisThresholds> = {
  itchiness: 'itchiness',
  erythema: 'erythema',
  skinThickness: 'skinThickness',
  scaling: 'scaling',
  skinPain: 'skinPain',
  functionLoss: 'functionLoss',
  sleepDisturbance: 'sleepDisturbance',
  stress: 'stress',
  anxiety: 'anxiety',
  depression: 'depression',
  fatigue: 'fatigue',
  myalgia: 'myalgia',
  bodyTemp: 'bodyTemp',
  abdominalPain: 'abdominalPain',
  appetiteLoss: 'appetiteLoss',
  jointPain: 'jointPain'
};

function normalize(value: number, baseline: number, min: number, max: number): number {
  if (max === 1 && min === 0) {
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

export function calculatePsfiScore(
  inputs: PsoriasisInputValues,
  thresholds: PsoriasisThresholds = DEFAULT_THRESHOLDS
): PsoriasisAIResult {
  const contributions: PsoriasisContribution[] = [];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  (Object.keys(indicatorLabels) as Array<keyof typeof indicatorLabels>).forEach((key) => {
    const indicatorValue = inputs[inputKeyMap[key]] ?? 0;
    const baseline = thresholds[thresholdKeyMap[key]];
    const { min, max } = rangeMap[key];

    const normalized = normalize(indicatorValue, baseline, min, max);
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

export function classifyPsfiRisk(
  score: number
): { level: PsoriasisRiskLevel; label: string; message: string } {
  if (score < 30) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '현재로서는 피부 병변/가려움 악화 신호가 크지 않습니다.'
    };
  }

  if (score < 60) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '피부 증상이 평소보다 악화된 신호가 있습니다.'
    };
  }

  return {
    level: 'flare',
    label: '고위험 flare 단계',
    message: '피부 병변과 가려움이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.'
  };
}

export function getDefaultPsoriasisThresholds(): PsoriasisThresholds {
  return { ...DEFAULT_THRESHOLDS };
}




