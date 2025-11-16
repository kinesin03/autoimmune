import { UVIndexTimeSlot } from '../types';

// 자외선 지수 기준치에 따른 상태 판정
export function getUVIndexStatus(uvIndex: number): 'low' | 'normal' | 'high' | 'veryHigh' | 'danger' {
  if (uvIndex >= 11) {
    return 'danger'; // 위험
  } else if (uvIndex >= 8) {
    return 'veryHigh'; // 매우높음
  } else if (uvIndex >= 6) {
    return 'high'; // 높음
  } else if (uvIndex >= 3) {
    return 'normal'; // 보통
  } else {
    return 'low'; // 낮음
  }
}

// 상태에 따른 한글 표시
export function getUVIndexStatusText(status: 'low' | 'normal' | 'high' | 'veryHigh' | 'danger'): string {
  const statusMap = {
    'low': '낮음',
    'normal': '보통',
    'high': '높음',
    'veryHigh': '매우높음',
    'danger': '위험'
  };
  return statusMap[status];
}

// 상태에 따른 색상
export function getUVIndexStatusColor(status: 'low' | 'normal' | 'high' | 'veryHigh' | 'danger'): string {
  const colorMap = {
    'low': '#e9ecef', // 연한 회색
    'normal': '#fff3cd', // 연한 노란색/베이지
    'high': '#ffc107', // 주황색
    'veryHigh': '#dc3545', // 빨간색
    'danger': '#6f42c1' // 보라색
  };
  return colorMap[status];
}

// 요일 이름 가져오기
export function getDayName(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

// 기본 시간대 설정
export const defaultTimeSlots = [
  '06시~09시',
  '09시~12시',
  '12시~15시',
  '15시~18시'
];

