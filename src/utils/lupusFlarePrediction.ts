import { DailyUVIndex, UVIndexTimeSlot } from '../types';
import { getUVIndexStatus } from './uvIndexHelper';

export interface LupusFlarePrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'veryHigh' | 'critical';
  riskScore: number; // 0-100
  probability: number; // 0-100%
  message: string;
  riskFactors: string[];
  recommendations: string[];
  highRiskTimeSlots: Array<{
    date: string;
    dayName: string;
    timeRange: string;
    uvIndex: number;
    status: string;
  }>;
}

// 자외선 지수 데이터 가져오기 (실제로는 API에서 가져와야 함)
export async function fetchUVIndexData(date: string): Promise<UVIndexTimeSlot[]> {
  // 실제 구현 시 OpenUV API나 기상청 API 사용
  // 여기서는 예시 데이터 반환
  const hour = new Date(date).getHours();
  const month = new Date(date).getMonth();
  
  // 계절과 시간에 따른 예상 자외선 지수
  let baseUV = 3;
  if (month >= 5 && month <= 8) { // 여름 (6-8월)
    baseUV = 7;
  } else if (month >= 3 && month <= 10) { // 봄/가을 (4-10월)
    baseUV = 5;
  }
  
  // 시간대별 자외선 지수 계산
  const timeSlots = [
    { range: '06시~09시', hour: 7.5, factor: 0.3 },
    { range: '09시~12시', hour: 10.5, factor: 0.8 },
    { range: '12시~15시', hour: 13.5, factor: 1.0 },
    { range: '15시~18시', hour: 16.5, factor: 0.6 }
  ];
  
  return timeSlots.map(slot => {
    // 정오 시간대가 가장 높음
    let uvIndex = baseUV * slot.factor;
    // 랜덤 변동 추가 (실제 데이터는 API에서 가져옴)
    uvIndex += (Math.random() - 0.5) * 2;
    uvIndex = Math.max(0, Math.min(15, Math.round(uvIndex * 10) / 10));
    
    return {
      timeRange: slot.range,
      uvIndex,
      status: getUVIndexStatus(uvIndex)
    };
  });
}

// 루푸스 flare 예측
export function predictLupusFlare(
  dailyUVIndex: DailyUVIndex[],
  sunlightExposure: number
): LupusFlarePrediction {
  if (!dailyUVIndex || dailyUVIndex.length === 0) {
    return {
      riskLevel: 'low',
      riskScore: 0,
      probability: 0,
      message: '자외선 지수 데이터가 없습니다.',
      riskFactors: [],
      recommendations: ['자외선 지수 데이터를 확인해주세요.'],
      highRiskTimeSlots: []
    };
  }

  let totalRiskScore = 0;
  const riskFactors: string[] = [];
  const highRiskTimeSlots: Array<{
    date: string;
    dayName: string;
    timeRange: string;
    uvIndex: number;
    status: string;
  }> = [];

  // 각 날짜별로 분석
  dailyUVIndex.forEach(day => {
    day.timeSlots.forEach(slot => {
      let slotRisk = 0;
      
      // 자외선 지수에 따른 위험 점수
      if (slot.status === 'danger') {
        slotRisk += 25;
        riskFactors.push(`${day.date.split('-')[2]}일 ${slot.timeRange} 자외선 지수 위험 (${slot.uvIndex})`);
        highRiskTimeSlots.push({
          date: day.date,
          dayName: day.dayName,
          timeRange: slot.timeRange,
          uvIndex: slot.uvIndex,
          status: '위험'
        });
      } else if (slot.status === 'veryHigh') {
        slotRisk += 15;
        riskFactors.push(`${day.date.split('-')[2]}일 ${slot.timeRange} 자외선 지수 매우높음 (${slot.uvIndex})`);
        highRiskTimeSlots.push({
          date: day.date,
          dayName: day.dayName,
          timeRange: slot.timeRange,
          uvIndex: slot.uvIndex,
          status: '매우높음'
        });
      } else if (slot.status === 'high') {
        slotRisk += 10;
      } else if (slot.status === 'normal') {
        slotRisk += 5;
      }
      
      totalRiskScore += slotRisk;
    });
  });

  // 햇빛 노출 시간에 따른 추가 위험
  if (sunlightExposure > 2) {
    totalRiskScore += sunlightExposure * 5;
    riskFactors.push(`햇빛 노출 시간 ${sunlightExposure}시간 (권장: 2시간 이하)`);
  }

  // 연속된 높은 자외선 지수 패턴 감지
  let consecutiveHighUV = 0;
  dailyUVIndex.forEach(day => {
    const highUVSlots = day.timeSlots.filter(s => 
      s.status === 'high' || s.status === 'veryHigh' || s.status === 'danger'
    );
    if (highUVSlots.length >= 2) {
      consecutiveHighUV++;
    }
  });
  
  if (consecutiveHighUV >= 2) {
    totalRiskScore += 20;
    riskFactors.push('연속된 높은 자외선 지수 패턴 감지');
  }

  // 위험 수준 결정
  let riskLevel: 'low' | 'medium' | 'high' | 'veryHigh' | 'critical';
  let probability: number;
  
  if (totalRiskScore >= 80) {
    riskLevel = 'critical';
    probability = 85;
  } else if (totalRiskScore >= 60) {
    riskLevel = 'veryHigh';
    probability = 70;
  } else if (totalRiskScore >= 40) {
    riskLevel = 'high';
    probability = 50;
  } else if (totalRiskScore >= 20) {
    riskLevel = 'medium';
    probability = 30;
  } else {
    riskLevel = 'low';
    probability = 10;
  }

  // 메시지 생성
  let message = '';
  if (riskLevel === 'critical' || riskLevel === 'veryHigh') {
    message = `⚠️ Flare 발생 위험이 ${riskLevel === 'critical' ? '매우 높습니다' : '높습니다'}!`;
    message += `\n예상 확률: ${probability}%`;
    if (highRiskTimeSlots.length > 0) {
      message += `\n${highRiskTimeSlots.length}개 시간대에서 위험 수준의 자외선 지수 확인`;
    }
  } else if (riskLevel === 'high') {
    message = `⚠️ Flare 발생 위험이 있습니다.`;
    message += `\n예상 확률: ${probability}%`;
  } else if (riskLevel === 'medium') {
    message = `⚠️ Flare 발생 가능성이 보통입니다.`;
    message += `\n예상 확률: ${probability}%`;
  } else {
    message = `✅ 현재 Flare 발생 위험이 낮습니다.`;
    message += `\n예상 확률: ${probability}%`;
  }

  // 권장 사항 생성
  const recommendations: string[] = [];
  
  if (highRiskTimeSlots.length > 0) {
    recommendations.push(`다음 시간대 외출 자제: ${highRiskTimeSlots.map(s => `${s.date.split('-')[2]}일 ${s.timeRange}`).join(', ')}`);
  }
  
  if (sunlightExposure > 2) {
    recommendations.push(`햇빛 노출 시간을 2시간 이하로 줄이세요 (현재: ${sunlightExposure}시간)`);
  }
  
  recommendations.push('자외선 차단제 사용 (SPF 30 이상)');
  recommendations.push('긴팔, 모자, 선글라스 착용');
  recommendations.push('그늘에서 활동하기');
  
  if (riskLevel === 'low') {
    recommendations.push('현재 상태를 유지하세요');
  }

  return {
    riskLevel,
    riskScore: Math.min(100, totalRiskScore),
    probability,
    message,
    riskFactors: riskFactors.length > 0 ? riskFactors : ['현재 위험 요인 없음'],
    recommendations,
    highRiskTimeSlots
  };
}

