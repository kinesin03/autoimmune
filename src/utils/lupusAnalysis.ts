export interface LupusInputValues {
  fatigue: number;
  fever: number;
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
  itch: number;
  sunExposure: number; // minutes 0-120
  facialRash: number; // 0-10
  oralUlcer: number; // 0-10
}

export type LupusRiskLevel = 'stable' | 'caution' | 'flare';

export interface LupusContribution {
  key: keyof typeof weights;
  label: string;
  contribution: number;
  normalized: number;
  weight: number;
}

export interface LupusAIResult {
  score: number;
  contributions: LupusContribution[];
}

const weights = {
  facialRash: 4.0,
  sunExposure: 3.0,
  oralUlcer: 3.0,
  fatigue: 2.0,
  jointPain: 2.0,
  fever: 1.0,
  myalgia: 1.0,
  skinPain: 1.0,
  itch: 1.0,
  stress: 0.5,
  sleepDisturbance: 0.5,
  anxiety: 0.3,
  depression: 0.3,
  appetiteLoss: 0.3,
  abdominalPain: 0.3,
  functionLoss: 0.3
} as const;

const indicatorMeta: Record<keyof typeof weights, { label: string; scale: number }> = {
  facialRash: { label: '얼굴 발진', scale: 10 },
  sunExposure: { label: '햇빛 노출', scale: 120 },
  oralUlcer: { label: '구강 궤양', scale: 10 },
  fatigue: { label: '피로감', scale: 10 },
  jointPain: { label: '관절통', scale: 10 },
  fever: { label: '발열', scale: 10 },
  myalgia: { label: '몸살', scale: 10 },
  skinPain: { label: '피부 통증', scale: 10 },
  itch: { label: '가려움', scale: 10 },
  stress: { label: '스트레스', scale: 10 },
  sleepDisturbance: { label: '수면 장애', scale: 10 },
  anxiety: { label: '불안감', scale: 10 },
  depression: { label: '우울감', scale: 10 },
  appetiteLoss: { label: '입맛 저하', scale: 1 },
  abdominalPain: { label: '복통', scale: 10 },
  functionLoss: { label: '기능저하', scale: 10 }
};

export function calculateLupusScore(inputs: LupusInputValues): LupusAIResult {
  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const contributions: LupusContribution[] = [];
  let numerator = 0;

  (Object.keys(weights) as Array<keyof typeof weights>).forEach((key) => {
    const scale = indicatorMeta[key].scale;
    const normalized = Math.max(0, Math.min(1, (inputs[key] ?? 0) / scale));
    const contribution = weights[key] * normalized;
    numerator += contribution;
    contributions.push({
      key,
      label: indicatorMeta[key].label,
      normalized,
      weight: weights[key],
      contribution
    });
  });

  const score = Math.max(0, Math.min(100, (numerator / totalWeight) * 100));

  return {
    score,
    contributions: contributions
      .filter((item) => item.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)
  };
}

export function classifyLupusRisk(
  score: number
): { level: LupusRiskLevel; label: string; message: string } {
  if (score < 30) {
    return {
      level: 'stable',
      label: '안정 단계',
      message: '피부·관절·전신 증상이 비교적 안정적입니다.'
    };
  }

  if (score < 60) {
    return {
      level: 'caution',
      label: '주의 단계',
      message: '피로 또는 피부/관절 증상이 평소보다 악화되고 있습니다.'
    };
  }

  return {
    level: 'flare',
    label: '고위험 flare 단계',
    message: '피부/관절/전신 증상이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.'
  };
}




