/**
 * 환경 데이터 페처
 * 여러 API 소스를 통합하여 환경 데이터를 가져옵니다.
 * 우선순위: OpenWeatherMap > 기상청 > 예시 데이터
 */

import { EnvironmentalData } from '../../types';
import { fetchFromOpenWeatherMap } from './openWeatherMapClient';
import { fetchFromKMA } from './kmaApiClient';
import { generateMockWeatherData } from './mockWeatherData';

// 대전광역시 유성구 좌표
const DEFAULT_LAT = 36.3628;
const DEFAULT_LON = 127.3456;

/**
 * 환경 데이터 가져오기
 * @param date 날짜 (YYYY-MM-DD)
 * @param lat 위도 (선택, 기본값: 대전 유성구)
 * @param lon 경도 (선택, 기본값: 대전 유성구)
 * @returns 환경 데이터
 */
export async function fetchEnvironmentalData(
  date: string,
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
): Promise<EnvironmentalData> {
  try {
    // 오늘 날짜인 경우에만 실시간 API 호출
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    
    // 1순위: OpenWeatherMap API 시도 (오늘 날짜일 때만)
    if (isToday) {
      console.log('🔄 오늘 날짜 데이터 요청 - OpenWeatherMap API 호출 시도', { date, today });
      const owmData = await fetchFromOpenWeatherMap(lat, lon);
      if (owmData) {
        console.log('✅ OpenWeatherMap에서 실시간 데이터 수신 성공:', owmData);
        // _isRealTime 플래그가 이미 설정되어 있으므로 그대로 반환
        console.log('✅ 실시간 데이터 플래그 확인:', (owmData as any)._isRealTime);
        return owmData;
      } else {
        console.warn('⚠️ OpenWeatherMap API 호출 실패 또는 데이터 없음, 기상청 API 또는 예시 데이터로 폴백');
        console.warn('⚠️ API 키를 확인하고 브라우저 콘솔의 에러 메시지를 확인하세요.');
      }
    } else {
      console.log(`ℹ️ 과거 날짜 데이터 요청 (${date}) - API 호출 생략, 예시 데이터 사용`);
    }
    
    // 2순위: 기상청 API 시도
    const kmaData = await fetchFromKMA(date, lat, lon);
    if (kmaData) {
      console.log('✅ 기상청에서 데이터 수신 성공:', kmaData);
      return kmaData;
    }
    
    // 3순위: 예시 데이터 생성
    console.warn('⚠️ 모든 API 호출 실패, 예시 데이터 사용');
    return generateMockWeatherData(date);
    
  } catch (error) {
    console.error('환경 데이터 가져오기 실패:', error);
    // 기본값 반환
    return {
      date,
      temperature: 20,
      humidity: 50,
      pressure: 1013,
      weatherIndex: 70
    };
  }
}

