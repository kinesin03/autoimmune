/**
 * 기상청 API 유틸리티 함수
 * 위경도를 기상청 격자 좌표로 변환하고, API 요청 시간을 계산합니다.
 */

/**
 * 위경도를 기상청 격자 좌표로 변환
 * @param lat 위도
 * @param lon 경도
 * @returns 기상청 격자 좌표 (nx, ny)
 */
export function convertLatLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

/**
 * 현재 시간 기준으로 기상청 API 요청 시간 계산
 * @param isUltraSrt 초단기실황 여부 (true: 초단기실황, false: 단기예보)
 * @returns baseDate와 baseTime
 */
export function getBaseDateTime(isUltraSrt: boolean = false): { baseDate: string; baseTime: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  if (isUltraSrt) {
    // 초단기실황: 매 시간 정각에 발표 (현재 시간의 정시 사용)
    // 예: 14:30 -> 14:00, 14:00 -> 14:00
    // 단, 현재 시간이 정각이면 이전 시간 사용 (데이터 준비 시간 고려)
    let baseHour = hour;
    if (minute === 0 && hour > 0) {
      // 정각이면 이전 시간 데이터 사용
      baseHour = hour - 1;
    } else if (hour === 0 && minute === 0) {
      // 새벽 0시 정각이면 전날 23시 사용
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        baseDate: `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`,
        baseTime: '2300'
      };
    }
    
    return {
      baseDate: `${year}${month}${day}`,
      baseTime: String(baseHour).padStart(2, '0') + '00'
    };
  } else {
    // 단기예보: 특정 시간에만 제공 (0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)
    if (hour < 2) {
      // 새벽 시간대는 전날 23시 데이터 사용
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        baseDate: `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`,
        baseTime: '2300'
      };
    }
    
    // 정시 데이터 사용 (02시, 05시, 08시, 11시, 14시, 17시, 20시, 23시)
    const validHours = [2, 5, 8, 11, 14, 17, 20, 23];
    let baseTimeHour = validHours[0];
    for (let i = validHours.length - 1; i >= 0; i--) {
      if (hour >= validHours[i]) {
        baseTimeHour = validHours[i];
        break;
      }
    }
    
    return {
      baseDate: `${year}${month}${day}`,
      baseTime: String(baseTimeHour).padStart(2, '0') + '00'
    };
  }
}

