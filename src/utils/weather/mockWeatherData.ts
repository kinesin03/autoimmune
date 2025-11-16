/**
 * 예시 기상 데이터 생성기
 * API가 없거나 실패 시 사용할 예시 데이터를 생성합니다.
 * ⚠️ 주의: 이는 실제 기상 데이터가 아닌 예시 값입니다.
 */

import { EnvironmentalData } from '../../types';
import { calculateWeatherIndex } from './weatherIndexCalculator';

/**
 * 예시 환경 데이터 생성
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 예시 환경 데이터
 */
export function generateMockWeatherData(date: string): EnvironmentalData {
  const apiKeyCheck = import.meta.env.VITE_WEATHER_API_KEY || import.meta.env.VITE_KMA_API_KEY;
  console.warn('⚠️ 예시 데이터 생성 중:', {
    date,
    hasWeatherApiKey: !!import.meta.env.VITE_WEATHER_API_KEY,
    hasKmaApiKey: !!import.meta.env.VITE_KMA_API_KEY,
    apiKeyPreview: apiKeyCheck ? `${apiKeyCheck.substring(0, 10)}...` : '없음'
  });
  
  const month = new Date(date).getMonth();
  
  // 대전 유성구 계절별 평균 기온 (실제 평균값 기반)
  let baseTemp = 12; // 봄/가을 기본값 (3-5월, 9-11월)
  let baseHumidity = 55;
  let basePressure = 1015;
  
  if (month >= 5 && month <= 8) { // 여름 (6-8월)
    baseTemp = 26;
    baseHumidity = 75;
    basePressure = 1005;
  } else if (month >= 11 || month <= 2) { // 겨울 (12-2월)
    baseTemp = 2;
    baseHumidity = 50;
    basePressure = 1020;
  } else if (month >= 2 && month <= 4) { // 봄 (3-5월)
    baseTemp = 15;
    baseHumidity = 60;
    basePressure = 1013;
  } else if (month >= 8 && month <= 10) { // 가을 (9-11월)
    baseTemp = 18;
    baseHumidity = 65;
    basePressure = 1015;
  }
  
  // 일일 변동 추가 (실제 날씨와 유사하게, 랜덤 대신 날짜 기반)
  // 같은 날짜면 같은 값이 나오도록 (시드 사용)
  const dateSeed = parseInt(date.replace(/-/g, '')) % 100;
  const dayVariation = (dateSeed % 20 - 10) * 0.3; // ±3도 범위
  const temperature = baseTemp + dayVariation;
  const humidity = baseHumidity + (dateSeed % 30 - 15) * 0.5; // ±7.5% 범위
  const pressure = basePressure + (dateSeed % 20 - 10) * 0.2; // ±2hPa 범위
  
  // 생활기상지수 계산 (0-100)
  let weatherIndex = 70;
  if (temperature < 5 || temperature > 30) weatherIndex -= 20;
  if (humidity < 30 || humidity > 80) weatherIndex -= 15;
  if (pressure < 1000 || pressure > 1025) weatherIndex -= 10;
  weatherIndex = Math.max(0, Math.min(100, weatherIndex));
  
  return {
    date,
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    pressure: Math.round(pressure * 10) / 10,
    weatherIndex: Math.round(weatherIndex * 10) / 10
  };
}

