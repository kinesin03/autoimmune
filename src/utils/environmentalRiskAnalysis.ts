import { EnvironmentalData, EnvironmentalRiskAnalysis } from '../types';

/**
 * 환경 정보 기반 flare 위험도 산출
 * @param environmentalData 환경 데이터 배열
 * @returns 환경 위험도 분석 결과
 */
export function analyzeEnvironmentalRisk(
  environmentalData: EnvironmentalData[]
): EnvironmentalRiskAnalysis {
  if (!environmentalData || environmentalData.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      factors: {
        temperature: false,
        humidity: false,
        pressure: false,
        weatherIndex: false
      },
      message: '환경 데이터가 없습니다.',
      recommendations: ['환경 데이터를 확인해주세요.']
    };
  }

  // 최근 데이터 분석 (최근 3일)
  const recentData = environmentalData.slice(-3);
  const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
  const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
  const avgWeatherIndex = recentData.reduce((sum, d) => sum + d.weatherIndex, 0) / recentData.length;

  let riskScore = 0;
  const factors = {
    temperature: false,
    humidity: false,
    pressure: false,
    weatherIndex: false
  };
  const riskFactors: string[] = [];

  // 기온 분석 (극단적인 온도가 문제)
  if (avgTemp < 5 || avgTemp > 30) {
    riskScore += 20;
    factors.temperature = true;
    riskFactors.push(`기온 ${avgTemp.toFixed(1)}°C (권장: 15-25°C)`);
  } else if (avgTemp < 10 || avgTemp > 28) {
    riskScore += 10;
    factors.temperature = true;
    riskFactors.push(`기온 ${avgTemp.toFixed(1)}°C`);
  }

  // 습도 분석 (너무 건조하거나 습함)
  if (avgHumidity < 30 || avgHumidity > 80) {
    riskScore += 15;
    factors.humidity = true;
    riskFactors.push(`습도 ${avgHumidity.toFixed(1)}% (권장: 40-60%)`);
  } else if (avgHumidity < 35 || avgHumidity > 75) {
    riskScore += 8;
    factors.humidity = true;
    riskFactors.push(`습도 ${avgHumidity.toFixed(1)}%`);
  }

  // 기압 분석 (급격한 변화가 문제)
  if (recentData.length >= 2) {
    const pressureChange = Math.abs(recentData[recentData.length - 1].pressure - recentData[0].pressure);
    if (pressureChange > 10) {
      riskScore += 15;
      factors.pressure = true;
      riskFactors.push(`기압 급격한 변화 (${pressureChange.toFixed(1)}hPa)`);
    } else if (pressureChange > 5) {
      riskScore += 8;
      factors.pressure = true;
      riskFactors.push(`기압 변화 (${pressureChange.toFixed(1)}hPa)`);
    }
  }

  // 생활기상지수 분석
  if (avgWeatherIndex < 40) {
    riskScore += 20;
    factors.weatherIndex = true;
    riskFactors.push(`생활기상지수 낮음 (${avgWeatherIndex.toFixed(1)})`);
  } else if (avgWeatherIndex < 50) {
    riskScore += 10;
    factors.weatherIndex = true;
    riskFactors.push(`생활기상지수 보통 (${avgWeatherIndex.toFixed(1)})`);
  }

  // 위험 수준 결정
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  if (riskScore >= 50) {
    riskLevel = 'critical';
  } else if (riskScore >= 30) {
    riskLevel = 'high';
  } else if (riskScore >= 15) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // 메시지 생성
  let message = '';
  if (riskLevel === 'critical' || riskLevel === 'high') {
    message = `⚠️ 환경 요인으로 인한 Flare 위험이 ${riskLevel === 'critical' ? '매우 높습니다' : '높습니다'}!`;
    if (riskFactors.length > 0) {
      message += `\n${riskFactors.join(', ')}`;
    }
  } else if (riskLevel === 'medium') {
    message = `⚠️ 환경 요인으로 인한 Flare 위험이 있습니다.`;
    if (riskFactors.length > 0) {
      message += `\n${riskFactors.join(', ')}`;
    }
  } else {
    message = `✅ 현재 환경 조건이 양호합니다.`;
  }

  // 권장 사항 생성
  const recommendations: string[] = [];
  
  if (factors.temperature) {
    if (avgTemp < 10) {
      recommendations.push('실내 온도 유지, 따뜻한 옷 착용');
    } else if (avgTemp > 28) {
      recommendations.push('시원한 곳에서 휴식, 충분한 수분 섭취');
    }
  }
  
  if (factors.humidity) {
    if (avgHumidity < 35) {
      recommendations.push('가습기 사용, 충분한 수분 섭취');
    } else if (avgHumidity > 75) {
      recommendations.push('제습기 사용, 통풍 유지');
    }
  }
  
  if (factors.pressure) {
    recommendations.push('기압 변화 시 휴식, 무리한 활동 자제');
  }
  
  if (factors.weatherIndex) {
    recommendations.push('외출 시 주의, 실내 활동 권장');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('현재 환경 조건을 유지하세요');
  }

  return {
    riskScore: Math.min(100, riskScore),
    riskLevel,
    factors,
    message,
    recommendations
  };
}

// 환경 데이터 가져오기 함수는 weather/environmentalDataFetcher.ts로 이동
export { fetchEnvironmentalData } from './weather/environmentalDataFetcher';

