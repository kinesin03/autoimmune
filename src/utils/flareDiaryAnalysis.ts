import {
  FlareDiaryEntry,
  FlareTrigger,
  HospitalReport,
  FlareRecord,
  StressRecord,
  FoodRecord,
  SleepRecord,
  EnvironmentalData
} from '../types';

// AI 기반 Trigger 목록 업데이트
export function updateFlareTriggers(
  flareDiary: FlareDiaryEntry[],
  stressRecords: StressRecord[],
  foodRecords: FoodRecord[],
  sleepRecords: SleepRecord[],
  environmentalData: EnvironmentalData[]
): FlareTrigger[] {
  const triggers: Map<string, FlareTrigger> = new Map();

  // Flare 일지에서 유발 요인 분석
  flareDiary.forEach(entry => {
    entry.estimatedTriggers.forEach(triggerName => {
      if (!triggers.has(triggerName)) {
        triggers.set(triggerName, {
          id: Date.now().toString() + Math.random(),
          name: triggerName,
          category: categorizeTrigger(triggerName),
          confidence: 0,
          frequency: 0,
          recommendation: getTriggerRecommendation(triggerName)
        });
      }
      const trigger = triggers.get(triggerName)!;
      trigger.frequency++;
      if (!trigger.lastOccurrence || entry.date > trigger.lastOccurrence) {
        trigger.lastOccurrence = entry.date;
      }
    });
  });

  // 스트레스 분석
  flareDiary.forEach(flare => {
    const flareDate = new Date(flare.date);
    const beforeFlare = stressRecords.filter(s => {
      const stressDate = new Date(s.date);
      const daysDiff = (flareDate.getTime() - stressDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 3 && s.level >= 7;
    });
    
    if (beforeFlare.length > 0) {
      const triggerName = '높은 스트레스';
      if (!triggers.has(triggerName)) {
        triggers.set(triggerName, {
          id: Date.now().toString() + Math.random(),
          name: triggerName,
          category: 'stress',
          confidence: 0,
          frequency: 0,
          recommendation: '스트레스 관리 기법 실천, 충분한 휴식'
        });
      }
      triggers.get(triggerName)!.frequency += beforeFlare.length;
    }
  });

  // 음식 분석
  flareDiary.forEach(flare => {
    const flareDate = new Date(flare.date);
    const beforeFlare = foodRecords.filter(f => {
      const foodDate = new Date(f.date + 'T' + f.time);
      const hoursDiff = (flareDate.getTime() - foodDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff >= 0 && hoursDiff <= 48;
    });

    beforeFlare.forEach(food => {
      food.foods.forEach(foodName => {
        const triggerName = `${foodName} 섭취`;
        if (!triggers.has(triggerName)) {
          triggers.set(triggerName, {
            id: Date.now().toString() + Math.random(),
            name: triggerName,
            category: 'food',
            confidence: 0,
            frequency: 0,
            recommendation: `${foodName} 섭취 피하기 또는 양 줄이기`
          });
        }
        triggers.get(triggerName)!.frequency++;
      });
    });
  });

  // 수면 분석
  flareDiary.forEach(flare => {
    const flareDate = new Date(flare.date);
    const beforeFlare = sleepRecords.filter(s => {
      const sleepDate = new Date(s.date);
      const daysDiff = (flareDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 3 && s.totalHours < 6;
    });

    if (beforeFlare.length > 0) {
      const triggerName = '수면 부족';
      if (!triggers.has(triggerName)) {
        triggers.set(triggerName, {
          id: Date.now().toString() + Math.random(),
          name: triggerName,
          category: 'sleep',
          confidence: 0,
          frequency: 0,
          recommendation: '충분한 수면 시간 확보 (7-8시간 권장)'
        });
      }
      triggers.get(triggerName)!.frequency += beforeFlare.length;
    }
  });

  // 환경 분석
  flareDiary.forEach(flare => {
    const flareDate = new Date(flare.date);
    const envData = environmentalData.find(e => e.date === flare.date);
    
    if (envData) {
      if (envData.temperature < 5 || envData.temperature > 30) {
        const triggerName = '극단적 기온';
        if (!triggers.has(triggerName)) {
          triggers.set(triggerName, {
            id: Date.now().toString() + Math.random(),
            name: triggerName,
            category: 'environment',
            confidence: 0,
            frequency: 0,
            recommendation: '실내 온도 유지, 적절한 옷차림'
          });
        }
        triggers.get(triggerName)!.frequency++;
      }
    }
  });

  // 신뢰도 계산
  const totalFlares = flareDiary.length;
  triggers.forEach(trigger => {
    trigger.confidence = Math.min(100, (trigger.frequency / totalFlares) * 100);
  });

  // 빈도순으로 정렬
  return Array.from(triggers.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10); // 상위 10개만 반환
}

function categorizeTrigger(triggerName: string): 'food' | 'stress' | 'environment' | 'sleep' | 'other' {
  if (triggerName.includes('음식') || triggerName.includes('섭취') || triggerName.includes('식사')) {
    return 'food';
  }
  if (triggerName.includes('스트레스') || triggerName.includes('감정')) {
    return 'stress';
  }
  if (triggerName.includes('기온') || triggerName.includes('습도') || triggerName.includes('기압') || triggerName.includes('날씨')) {
    return 'environment';
  }
  if (triggerName.includes('수면') || triggerName.includes('잠')) {
    return 'sleep';
  }
  return 'other';
}

function getTriggerRecommendation(triggerName: string): string {
  const recommendations: { [key: string]: string } = {
    '스트레스': '스트레스 관리 기법 실천',
    '수면 부족': '충분한 수면 시간 확보',
    '유제품': '유제품 섭취 피하기',
    '기온': '실내 온도 유지'
  };

  for (const [key, value] of Object.entries(recommendations)) {
    if (triggerName.includes(key)) {
      return value;
    }
  }
  return '해당 요인 피하기';
}

// 병원 리포트 생성
export function generateHospitalReport(
  flareDiary: FlareDiaryEntry[],
  periodDays: number = 30
): HospitalReport {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const periodFlares = flareDiary.filter(f => {
    const flareDate = new Date(f.date);
    return flareDate >= startDate && flareDate <= endDate;
  });

  // Flare 통계
  const flareCount = periodFlares.length;
  const averageSeverity = periodFlares.length > 0
    ? periodFlares.reduce((sum, f) => sum + f.severity, 0) / periodFlares.length
    : 0;

  // Trigger 분석
  const allTriggers: string[] = [];
  periodFlares.forEach(flare => {
    allTriggers.push(...flare.estimatedTriggers);
  });

  const triggerCounts: { [key: string]: number } = {};
  allTriggers.forEach(trigger => {
    triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
  });

  const topTriggers: FlareTrigger[] = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, frequency]) => ({
      id: name,
      name,
      category: categorizeTrigger(name),
      confidence: (frequency / flareCount) * 100,
      frequency,
      recommendation: getTriggerRecommendation(name)
    }));

  // 약물 순응도 계산
  const medicationEntries = periodFlares.filter(f => f.medications && f.medications.length > 0);
  let totalAdherence = 0;
  let adherenceCount = 0;

  medicationEntries.forEach(entry => {
    entry.medications!.forEach(med => {
      totalAdherence += med.adherence ? 100 : 0;
      adherenceCount++;
    });
  });

  const medicationAdherence = adherenceCount > 0
    ? totalAdherence / adherenceCount
    : 0;

  // 검사 수치 추출
  const testResults: { [key: string]: Array<{ date: string; value: string }> } = {};
  periodFlares.forEach(flare => {
    if (flare.testResults) {
      flare.testResults.forEach(test => {
        if (!testResults[test.name]) {
          testResults[test.name] = [];
        }
        testResults[test.name].push({
          date: test.date,
          value: test.value
        });
      });
    }
  });

  const testResultsArray = Object.entries(testResults).map(([name, values]) => {
    // 추세 분석 (간단한 로직)
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (values.length >= 2) {
      const first = parseFloat(values[0].value);
      const last = parseFloat(values[values.length - 1].value);
      if (!isNaN(first) && !isNaN(last)) {
        if (last < first * 0.9) trend = 'improving';
        else if (last > first * 1.1) trend = 'worsening';
      }
    }

    return {
      name,
      values,
      trend
    };
  });

  // 요약 생성
  let summary = `최근 ${periodDays}일간 Flare 발생 ${flareCount}회, 평균 심각도 ${averageSeverity.toFixed(1)}/10. `;
  if (topTriggers.length > 0) {
    summary += `주요 유발 요인: ${topTriggers.map(t => t.name).join(', ')}. `;
  }
  summary += `약물 순응도 ${medicationAdherence.toFixed(0)}%.`;

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    flareCount,
    averageSeverity: Math.round(averageSeverity * 10) / 10,
    topTriggers,
    medicationAdherence: Math.round(medicationAdherence),
    testResults: testResultsArray,
    summary
  };
}

