/**
 * 생활기상지수 계산기
 * 기온, 습도, 기압을 기반으로 생활기상지수(0-100)를 계산합니다.
 */

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
}

/**
 * 생활기상지수 계산
 * @param weatherData 기상 데이터 (기온, 습도, 기압)
 * @returns 생활기상지수 (0-100)
 */
export function calculateWeatherIndex(weatherData: WeatherData): number {
  let index = 70; // 기본값
  
  // 기온 점수 (15-25°C가 최적)
  if (weatherData.temperature >= 15 && weatherData.temperature <= 25) {
    index += 10;
  } else if (weatherData.temperature >= 10 && weatherData.temperature < 15) {
    index += 5;
  } else if (weatherData.temperature > 25 && weatherData.temperature <= 30) {
    index += 5;
  } else if (weatherData.temperature < 5 || weatherData.temperature > 30) {
    index -= 20;
  } else {
    index -= 10;
  }
  
  // 습도 점수 (40-60%가 최적)
  if (weatherData.humidity >= 40 && weatherData.humidity <= 60) {
    index += 10;
  } else if (weatherData.humidity >= 30 && weatherData.humidity < 40) {
    index += 5;
  } else if (weatherData.humidity > 60 && weatherData.humidity <= 70) {
    index += 5;
  } else if (weatherData.humidity < 30 || weatherData.humidity > 80) {
    index -= 15;
  } else {
    index -= 10;
  }
  
  // 기압 점수 (1000-1025hPa가 정상)
  if (weatherData.pressure >= 1000 && weatherData.pressure <= 1025) {
    index += 10;
  } else if (weatherData.pressure < 1000 || weatherData.pressure > 1025) {
    index -= 10;
  }
  
  return Math.max(0, Math.min(100, index));
}

