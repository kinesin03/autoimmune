/**
 * OpenWeatherMap API 클라이언트
 * OpenWeatherMap API를 사용하여 실시간 기상 데이터를 가져옵니다.
 */

import { EnvironmentalData } from '../../types';
import { calculateWeatherIndex } from './weatherIndexCalculator';

/**
 * OpenWeatherMap API로 실시간 데이터 가져오기
 * @param lat 위도
 * @param lon 경도
 * @returns 실시간 환경 데이터 또는 null (실패 시)
 */
export async function fetchFromOpenWeatherMap(
  lat: number, 
  lon: number
): Promise<(EnvironmentalData & { _isRealTime: true }) | null> {
  try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    
    // 상세한 환경 변수 디버깅
    console.log('🔍 API 키 확인 (상세):', {
      hasKey: !!apiKey,
      keyType: typeof apiKey,
      keyValue: apiKey,
      keyLength: apiKey?.length || 0,
      keyPreview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : '없음',
      allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('WEATHER') || k.includes('KMA')),
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD
    });
    
    if (!apiKey || apiKey === 'demo_key' || apiKey === 'your_api_key') {
      console.warn('❌ OpenWeatherMap API 키가 설정되지 않았습니다.');
      console.warn('💡 .env 파일에 VITE_WEATHER_API_KEY를 추가하고 서버를 재시작하세요.');
      return null;
    }
    
    console.log('🌐 OpenWeatherMap API 호출 시도...', { lat, lon, apiKeyLength: apiKey?.length });
    
    // fetch API 사용 (더 간단하고 브라우저 네이티브)
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
    console.log('🌐 API URL (키 마스킹):', url.replace(apiKey || '', '***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // CORS 문제 방지를 위한 옵션
      mode: 'cors',
      cache: 'no-cache'
    });
    
    console.log('📡 API 응답 상태:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenWeatherMap API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        url: url.replace(apiKey, '***')
      });
      
      if (response.status === 401 || response.status === 403) {
        console.error('🔑 API 키가 유효하지 않습니다!');
        console.error('💡 OpenWeatherMap에서 API 키를 확인하거나 새로 발급받아주세요.');
        console.error('💡 https://openweathermap.org/api 에서 무료 API 키를 발급받을 수 있습니다.');
        console.error('💡 API 키 활성화까지 몇 분이 걸릴 수 있습니다.');
      } else if (response.status === 429) {
        console.error('⏱️ API 호출 한도 초과. 잠시 후 다시 시도해주세요.');
      }
      return null;
    }
    
    const data = await response.json();
    console.log('OpenWeatherMap API 응답:', data);
    
    if (data && data.main) {
      const main = data.main;
      const weatherIndex = calculateWeatherIndex({
        temperature: main.temp,
        humidity: main.humidity,
        pressure: main.pressure
      });
      
      const result = {
        date: new Date().toISOString().split('T')[0],
        temperature: Math.round(main.temp * 10) / 10,
        humidity: main.humidity,
        pressure: Math.round(main.pressure),
        weatherIndex: Math.round(weatherIndex * 10) / 10,
        _isRealTime: true as const  // 실시간 데이터 플래그 명시적으로 설정
      } as EnvironmentalData & { _isRealTime: true };
      
      console.log('✅ 실시간 기상 데이터 수신:', result);
      console.log('✅ _isRealTime 플래그 확인:', result._isRealTime);
      return result;
    }
  } catch (error: any) {
    console.error('❌ OpenWeatherMap API 호출 중 오류:', {
      message: error.message,
      name: error.name
    });
    
    if (error.message.includes('fetch')) {
      console.error('🌐 네트워크 오류 또는 서버 응답 없음. 인터넷 연결을 확인해주세요.');
    }
  }
  
  return null;
}

