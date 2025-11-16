import { CommonSymptoms, DiseaseSpecificSymptoms, ProdromalFlarePrediction } from '../types';

// 전조 증상 기반 flare 예측
export function predictFlareFromProdromalSymptoms(
  commonSymptoms: CommonSymptoms,
  diseaseSpecific: DiseaseSpecificSymptoms
): ProdromalFlarePrediction {
  // 공통 증상 점수 계산 (0-25)
  const commonScore = 
    commonSymptoms.fatigue +
    commonSymptoms.anxietyDepressionConcentration +
    commonSymptoms.appetiteDigestion +
    commonSymptoms.jointPain +
    commonSymptoms.skinAbnormalities;

  // 질환별 증상 점수 계산
  let diseaseSpecificScore = 0;
  const contributingSymptoms: string[] = [];

  // 류마티스 관절염
  if (diseaseSpecific.rheumatoidArthritis) {
    const painCount = diseaseSpecific.rheumatoidArthritis.painLocations.length;
    diseaseSpecificScore += painCount * 2;
    if (painCount > 0) {
      contributingSymptoms.push(`관절통 부위 ${painCount}개`);
    }
  }

  // 건선
  if (diseaseSpecific.psoriasis) {
    const affectedAreas = Object.keys(diseaseSpecific.psoriasis.skinAreas).filter(area => {
      const symptoms = diseaseSpecific.psoriasis!.skinAreas[area];
      return symptoms.redness || symptoms.dryness || symptoms.itching || symptoms.scaling;
    });
    diseaseSpecificScore += affectedAreas.length * 2;
    if (affectedAreas.length > 0) {
      contributingSymptoms.push(`피부 증상 부위 ${affectedAreas.length}개`);
    }
  }

  // 크론병
  if (diseaseSpecific.crohnsDisease) {
    if (diseaseSpecific.crohnsDisease.bowelMovements.frequency > 3) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('배변 횟수 증가');
    }
    if (diseaseSpecific.crohnsDisease.bowelMovements.form === '설사') {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('설사');
    }
    if (diseaseSpecific.crohnsDisease.abdominalPainLocation.length > 0) {
      diseaseSpecificScore += diseaseSpecific.crohnsDisease.abdominalPainLocation.length * 1.5;
      contributingSymptoms.push('복통');
    }
  }

  // 제1형 당뇨병
  if (diseaseSpecific.type1Diabetes) {
    if (diseaseSpecific.type1Diabetes.bloodSugar.fasting > 126) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('공복 혈당 상승');
    }
    if (diseaseSpecific.type1Diabetes.bloodSugar.postprandial > 200) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('식후 혈당 상승');
    }
  }

  // 다발성 경화증
  if (diseaseSpecific.multipleSclerosis) {
    if (diseaseSpecific.multipleSclerosis.visionBlur) {
      diseaseSpecificScore += 4;
      contributingSymptoms.push('시야 흐림');
    }
    if (diseaseSpecific.multipleSclerosis.sensoryDullness) {
      diseaseSpecificScore += 4;
      contributingSymptoms.push('감각 둔화');
    }
    if (diseaseSpecific.multipleSclerosis.walkingDistance < 100) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('보행 거리 감소');
    }
  }

  // 루푸스
  if (diseaseSpecific.lupus) {
    if (diseaseSpecific.lupus.facialRash) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('얼굴 발진');
    }
    if (diseaseSpecific.lupus.oralUlcers) {
      diseaseSpecificScore += 3;
      contributingSymptoms.push('입안 궤양');
    }
    if (diseaseSpecific.lupus.sunlightExposure > 2) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('햇빛 노출 시간 증가');
    }
  }

  // 쇼그렌 증후군
  if (diseaseSpecific.sjogrensSyndrome) {
    if (diseaseSpecific.sjogrensSyndrome.tearSecretion < 3) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('눈물 분비 감소');
    }
    if (diseaseSpecific.sjogrensSyndrome.salivaSecretion < 3) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('침 분비 감소');
    }
  }

  // 자가면역성 갑상선 질환
  if (diseaseSpecific.autoimmuneThyroid) {
    if (diseaseSpecific.autoimmuneThyroid.pulse > 100 || diseaseSpecific.autoimmuneThyroid.pulse < 60) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('맥박 이상');
    }
    if (diseaseSpecific.autoimmuneThyroid.bodyTemperature > 37.5 || diseaseSpecific.autoimmuneThyroid.bodyTemperature < 36.0) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('체온 이상');
    }
    if (Math.abs(diseaseSpecific.autoimmuneThyroid.weightChange) > 2) {
      diseaseSpecificScore += 2;
      contributingSymptoms.push('체중 변화');
    }
    if (diseaseSpecific.autoimmuneThyroid.insomnia > 3) {
      diseaseSpecificScore += 1.5;
      contributingSymptoms.push('불면');
    }
    if (diseaseSpecific.autoimmuneThyroid.irritability > 3) {
      diseaseSpecificScore += 1.5;
      contributingSymptoms.push('괴민');
    }
    if (diseaseSpecific.autoimmuneThyroid.lethargy > 3) {
      diseaseSpecificScore += 1.5;
      contributingSymptoms.push('무기력');
    }
  }

  // 공통 증상 기여도 추가
  if (commonSymptoms.fatigue >= 3) {
    contributingSymptoms.push('피로감');
  }
  if (commonSymptoms.anxietyDepressionConcentration >= 3) {
    contributingSymptoms.push('불안/우울/집중력 저하');
  }
  if (commonSymptoms.jointPain >= 3) {
    contributingSymptoms.push('관절통');
  }
  if (commonSymptoms.skinAbnormalities >= 3) {
    contributingSymptoms.push('피부 이상');
  }

  // 총점 계산
  const totalScore = commonScore + diseaseSpecificScore;

  // 위험 수준 및 확률 결정
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let probability: number;

  if (totalScore >= 40) {
    riskLevel = 'critical';
    probability = 80;
  } else if (totalScore >= 30) {
    riskLevel = 'high';
    probability = 60;
  } else if (totalScore >= 20) {
    riskLevel = 'medium';
    probability = 40;
  } else {
    riskLevel = 'low';
    probability = 15;
  }

  // 메시지 생성
  let message = '';
  if (riskLevel === 'critical' || riskLevel === 'high') {
    message = `⚠️ Flare 발생 위험이 ${riskLevel === 'critical' ? '매우 높습니다' : '높습니다'}!`;
    message += `\n공통 증상 점수: ${commonScore}/25`;
    message += `\n질환별 증상 점수: ${Math.round(diseaseSpecificScore * 10) / 10}`;
    message += `\n총점: ${Math.round(totalScore * 10) / 10}`;
  } else if (riskLevel === 'medium') {
    message = `⚠️ Flare 발생 가능성이 보통입니다.`;
    message += `\n공통 증상 점수: ${commonScore}/25`;
    message += `\n질환별 증상 점수: ${Math.round(diseaseSpecificScore * 10) / 10}`;
  } else {
    message = `✅ 현재 Flare 발생 위험이 낮습니다.`;
    message += `\n공통 증상 점수: ${commonScore}/25`;
    message += `\n질환별 증상 점수: ${Math.round(diseaseSpecificScore * 10) / 10}`;
  }

  return {
    commonScore,
    diseaseSpecificScore: Math.round(diseaseSpecificScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
    riskLevel,
    probability,
    message,
    contributingSymptoms: contributingSymptoms.length > 0 
      ? contributingSymptoms 
      : ['현재 특별한 증상 없음']
  };
}

