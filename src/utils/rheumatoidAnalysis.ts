export interface RAInputValues {
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
  jointSwelling: number;
  jointStiffness: number;
  morningWorse: number;
}

export interface RAThresholds {
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
  jointSwelling: number;
  jointStiffness: number;
  morningWorse: number;
}

export type RafiRiskLevel = 'stable' | 'caution' | 'flare';

export interface RAFIContribution {
  key: keyof typeof indicatorLabels;
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface RheumatoidAIResult {
  score: number;
  contributions: RAFIContribution[];
}

const DEFAULT_THRESHOLDS: RAThresholds = {
  fatigue: 5.0,
  bodyTemp: 37.0,
  myalgia: 3.0,
  anxiety: 4.0,
  depression: 4.0,
  stress: 5.0,
  sleepDisturbance: 4.0,
  appetiteLoss: 0,
  abdominalPain: 2.0,
  jointPain: 5.0,
  functionLoss: 3.0,
  skinPain: 2.0,
  itchiness: 3.0,
  jointSwelling: 3.0,
  jointStiffness: 4.0,
  morningWorse: 0
};

const indicatorLabels = {
  jointPain: '관절통',
  jointSwelling: '관절부기',
  jointStiffness: '관절경직',
  morningWorse: '아침 악화',
  fatigue: '피로감',
  functionLoss: '기능저하',
  bodyTemp: '체온 이상',
  myalgia: '몸살/근육통',
  stress: '스트레스',
  sleepDisturbance: '수면 장애',
  anxiety: '불안감',
  depression: '우울감',
  appetiteLoss: '입맛저하',
  abdominalPain: '복통',
  skinPain: '피부 통증',
  itchiness: '가려움'
} as const;

const weights: Record<keyof typeof indicatorLabels, number> = {
  jointPain: 3.0,
  jointSwelling: 3.0,
  jointStiffness: 2.5,
  morningWorse: 1.5,
  fatigue: 2.0,
  functionLoss: 1.0,
  bodyTemp: 0.5,
  myalgia: 0.5,
  stress: 0.5,
  sleepDisturbance: 0.5,
  anxiety: 0.5,
  depression: 0.5,
  appetiteLoss: 0.3,
  abdominalPain: 0.3,
  skinPain: 0.3,
  itchiness: 0.3
};

const rangeMap: Record<keyof typeof indicatorLabels, { min: number; max: number }> = {
  jointPain: { min: 0, max: 10 },
  jointSwelling: { min: 0, max: 10 },
  jointStiffness: { min: 0, max: 10 },
  morningWorse: { min: 0, max: 1 },
  fatigue: { min: 0, max: 10 },
  functionLoss: { min: 0, max: 10 },
  bodyTemp: { min: 34.5, max: 40 },
  myalgia: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  sleepDisturbance: { min: 0, max: 10 },
  anxiety: { min: 0, max: 10 },
  depression: { min: 0, max: 10 },
  appetiteLoss: { min: 0, max: 1 },
  abdominalPain: { min: 0, max: 10 },
  skinPain: { min: 0, max: 10 },
  itchiness: { min: 0, max: 10 }
};

const keyMap: Record<keyof typeof indicatorLabels, keyof RAInputValues> = {
  jointPain: 'jointPain',
  jointSwelling: 'jointSwelling',
  jointStiffness: 'jointStiffness',
  morningWorse: 'morningWorse',
  fatigue: 'fatigue',
  functionLoss: 'functionLoss',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  stress: 'stress',
  sleepDisturbance: 'sleepDisturbance',
  anxiety: 'anxiety',
  depression: 'depression',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  skinPain: 'skinPain',
  itchiness: 'itchiness'
};

const thresholdKeyMap: Record<keyof typeof indicatorLabels, keyof RAThresholds> = {
  jointPain: 'jointPain',
  jointSwelling: 'jointSwelling',
  jointStiffness: 'jointStiffness',
  morningWorse: 'morningWorse',
  fatigue: 'fatigue',
  functionLoss: 'functionLoss',
  bodyTemp: 'bodyTemp',
  myalgia: 'myalgia',
  stress: 'stress',
  sleepDisturbance: 'sleepDisturbance',
  anxiety: 'anxiety',
  depression: 'depression',
  appetiteLoss: 'appetiteLoss',
  abdominalPain: 'abdominalPain',
  skinPain: 'skinPain',
  itchiness: 'itchiness'
};

function normalize(
  value: number,
  baseline: number,
  min: number,
  max: number
): number {
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

export function calculateRafiScore(
  inputs: RAInputValues,
  thresholds: RAThresholds = DEFAULT_THRESHOLDS
): RheumatoidAIResult {
  const contributions: RAFIContribution[] = [];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  let weightedSum = 0;

  (Object.keys(indicatorLabels) as Array<keyof typeof indicatorLabels>).forEach(
    (key) => {
      const indicatorValue = inputs[keyMap[key]] ?? 0;
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
    }
  );

  const score = Math.max(
    0,
    Math.min(100, (weightedSum / totalWeight) * 100)
  );

  const sortedContributions = contributions
    .slice()
    .sort((a, b) => b.contribution - a.contribution);

  return {
    score,
    contributions: sortedContributions
  };
}

export function classifyRafiRisk(
  score: number
): { level: RafiRiskLevel; label: string; message: string } {
  if (score < 35) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '현재로서는 뚜렷한 RA flare 신호가 크지 않습니다.'
    };
  }

  if (score < 65) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '최근 관절/전신 증상이 평소보다 악화된 신호가 있습니다.'
    };
  }

  return {
    level: 'flare',
    label: '고위험 flare 단계',
    message:
      '관절통·부기·강직과 전신 증상이 뚜렷하게 증가했습니다. 의료진 상담을 권장합니다.'
  };
}

export function getDefaultThresholds(): RAThresholds {
  return { ...DEFAULT_THRESHOLDS };
}




