/**
 * 기상청 API 클라이언트
 * 기상청 공공데이터 API를 사용하여 기상 데이터를 가져옵니다.
 */

import { EnvironmentalData } from '../../types';
import { convertLatLonToGrid, getBaseDateTime } from './kmaApiHelper';
import { calculateWeatherIndex } from './weatherIndexCalculator';

/**
 * 기상청 API로 환경 데이터 가져오기
 * @param date 날짜 (YYYY-MM-DD)
 * @param lat 위도
 * @param lon 경도
 * @returns 환경 데이터 또는 null (실패 시)
 */
export async function fetchFromKMA(
  date: string,
  lat: number,
  lon: number
): Promise<EnvironmentalData | null> {
  const apiKey = import.meta.env.VITE_KMA_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  const grid = convertLatLonToGrid(lat, lon);
  const axios = (await import('axios')).default;
  
  try {
    // 초단기실황 조회 (현재 날씨) - 매 시간 제공
    const { baseDate: ultraBaseDate, baseTime: ultraBaseTime } = getBaseDateTime(true);
    const ultraSrtUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    const ultraSrtParams = {
      serviceKey: decodeURIComponent(apiKey),
      pageNo: '1',
      numOfRows: '10',
      dataType: 'JSON',
      base_date: ultraBaseDate,
      base_time: ultraBaseTime,
      nx: grid.nx.toString(),
      ny: grid.ny.toString()
    };
    
    const ultraSrtResponse = await axios.get(ultraSrtUrl, { params: ultraSrtParams });
    
    if (ultraSrtResponse.data?.response?.body?.items?.item) {
      const items = ultraSrtResponse.data.response.body.items.item;
      
      // 데이터 파싱
      let temperature = 20; // 기본값
      let humidity = 50;
      let pressure = 1013;
      
      items.forEach((item: any) => {
        if (item.category === 'T1H') { // 기온
          temperature = parseFloat(item.obsrValue);
        } else if (item.category === 'REH') { // 습도
          humidity = parseFloat(item.obsrValue);
        }
      });
      
      // 기압은 단기예보에서 가져오기
      try {
        const { baseDate: fcstBaseDate, baseTime: fcstBaseTime } = getBaseDateTime(false);
        const fcstUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
        const fcstParams = {
          serviceKey: decodeURIComponent(apiKey),
          pageNo: '1',
          numOfRows: '100',
          dataType: 'JSON',
          base_date: fcstBaseDate,
          base_time: fcstBaseTime,
          nx: grid.nx.toString(),
          ny: grid.ny.toString()
        };
        
        const fcstResponse = await axios.get(fcstUrl, { params: fcstParams });
        
        if (fcstResponse.data?.response?.body?.items?.item) {
          const fcstItems = fcstResponse.data.response.body.items.item;
          // 현재 시간에 가장 가까운 예보 시간 찾기
          const now = new Date();
          const currentHour = now.getHours();
          const targetFcstTime = String(currentHour).padStart(2, '0') + '00';
          
          const pressureItem = fcstItems.find((item: any) => 
            item.category === 'PRES' && item.fcstTime === targetFcstTime
          );
          if (pressureItem) {
            pressure = parseFloat(pressureItem.fcstValue) / 100; // hPa로 변환
          }
        }
      } catch (fcstError) {
        console.warn('단기예보 조회 실패, 기본값 사용:', fcstError);
      }
      
      // 생활기상지수 계산
      const weatherIndex = calculateWeatherIndex({ temperature, humidity, pressure });
      
      return {
        date,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        pressure: Math.round(pressure * 10) / 10,
        weatherIndex: Math.round(weatherIndex * 10) / 10
      };
    }
  } catch (apiError: any) {
    console.error('기상청 API 호출 실패:', apiError.response?.data || apiError.message);
    return null;
  }
  
  return null;
}

