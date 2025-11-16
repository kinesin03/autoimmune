// 공통 전조증상 점수 (0-5점)
export interface CommonSymptoms {
  fatigue: number; // 피로감
  anxietyDepressionConcentration: number; // 불안감, 우울감, 집중력
  appetiteDigestion: number; // 입맛 저하, 소화불량
  jointPain: number; // 관절통
  skinAbnormalities: number; // 피부 이상 (붉은기, 건조, 가려움)
}

// 질환별 전조증상
export interface RheumatoidArthritis {
  painLocations: string[]; // 통증 부위
}

export interface Psoriasis {
  skinAreas: {
    [area: string]: {
      redness: boolean;
      dryness: boolean;
      itching: boolean;
      scaling: boolean;
    };
  };
}

export interface CrohnsDisease {
  bowelMovements: {
    frequency: number; // 배변 횟수 (하루)
    form: string; // 형태 (정상, 묽음, 설사, 변비)
  };
  abdominalPainLocation: string[]; // 복통 위치
}

export interface Type1Diabetes {
  bloodSugar: {
    fasting: number; // 공복 혈당
    postprandial: number; // 식후 혈당
  };
  insulin: {
    time: string; // 투여 시간
    dosage: number; // 용량
  };
}

export interface MultipleSclerosis {
  visionBlur: boolean; // 시야 흐림
  sensoryDullness: boolean; // 감각 둔화
  walkingDistance: number; // 보행 거리 (미터)
  walkingTime: number; // 보행 시간 (분)
}

export interface UVIndexTimeSlot {
  timeRange: string; // 시간대 (예: "06시~09시")
  uvIndex: number; // 자외선 지수
  status: 'low' | 'normal' | 'high' | 'veryHigh' | 'danger'; // 상태
}

export interface DailyUVIndex {
  date: string; // 날짜 (YYYY-MM-DD)
  dayName: string; // 요일 (예: "금", "토")
  timeSlots: UVIndexTimeSlot[]; // 시간대별 자외선 지수
}

export interface Lupus {
  facialRash: boolean; // 얼굴 발진
  oralUlcers: boolean; // 입안 궤양
  sunlightExposure: number; // 햇빛 노출 시간 (시간)
  uvIndex?: number; // 자외선 수치 (API에서 가져옴) - 레거시
  dailyUVIndex?: DailyUVIndex[]; // 이틀치 시간대별 자외선 지수
}

export interface SjogrensSyndrome {
  tearSecretion: number; // 눈물 분비량 (0-10)
  salivaSecretion: number; // 침 분비량 (0-10)
}

export interface AutoimmuneThyroid {
  pulse: number; // 맥박
  bodyTemperature: number; // 체온
  weightChange: number; // 체중 변화 (kg)
  insomnia: number; // 불면 정도 (0-5)
  irritability: number; // 괴민 정도 (0-5)
  lethargy: number; // 무기력 정도 (0-5)
}

export interface DiseaseSpecificSymptoms {
  rheumatoidArthritis?: RheumatoidArthritis;
  psoriasis?: Psoriasis;
  crohnsDisease?: CrohnsDisease;
  type1Diabetes?: Type1Diabetes;
  multipleSclerosis?: MultipleSclerosis;
  lupus?: Lupus;
  sjogrensSyndrome?: SjogrensSyndrome;
  autoimmuneThyroid?: AutoimmuneThyroid;
}

export interface DiagnosisData {
  commonSymptoms: CommonSymptoms;
  diseaseSpecific: DiseaseSpecificSymptoms;
}

// Flare 유발 요인 분석 관련 타입
export interface FlareRecord {
  id: string;
  date: string; // 날짜 (YYYY-MM-DD)
  severity: number; // 심각도 (1-10)
  symptoms: string[]; // 증상 목록
  duration: number; // 지속 시간 (일)
}

export interface StressRecord {
  id: string;
  date: string;
  level: number; // 스트레스 수준 (0-10)
  note?: string; // 메모
}

export interface FoodRecord {
  id: string;
  date: string;
  time: string; // 시간 (HH:mm)
  foods: string[]; // 음식 목록
  photoUrl?: string; // 음식 사진 URL
  symptomsAfter?: {
    hours: number; // 섭취 후 몇 시간 후
    symptoms: string[]; // 증상 목록
    severity: number; // 심각도 (0-10)
  };
}

export interface SleepRecord {
  id: string;
  date: string;
  sleepTime: string; // 취침 시간 (HH:mm)
  wakeTime: string; // 기상 시간 (HH:mm)
  totalHours: number; // 총 수면 시간 (시간)
  quality: number; // 수면 질 (0-10)
}

export interface StressCorrelation {
  correlation: number; // 상관계수 (-1 ~ 1)
  averageDaysToFlare: number; // 평균 flare 발생까지 일수
  highStressFlareCount: number; // 스트레스 높은 주의 flare 횟수
  message: string; // 분석 메시지
}

export interface FoodCorrelation {
  food: string;
  flareProbability: number; // Flare 발생 확률 (0-100%)
  averageHoursToSymptom: number; // 평균 증상 발생까지 시간
  recommendation: 'avoid' | 'moderate' | 'safe'; // 추천 사항
  message: string; // 분석 메시지
}

export interface SleepCorrelation {
  correlation: number; // 상관계수 (-1 ~ 1)
  recommendedHours: number; // 권장 수면 시간
  message: string; // 분석 메시지
}

export interface FlareRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'; // 위험 수준
  riskScore: number; // 위험 점수 (0-100)
  factors: {
    stress: boolean;
    food: boolean;
    sleep: boolean;
  };
  message: string; // 경고 메시지
  recommendations: string[]; // 권장 사항
}

export interface FlareManagementData {
  flares: FlareRecord[];
  stressRecords: StressRecord[];
  foodRecords: FoodRecord[];
  sleepRecords: SleepRecord[];
  stressCorrelation?: StressCorrelation;
  foodCorrelations: FoodCorrelation[];
  sleepCorrelation?: SleepCorrelation;
  riskAnalysis?: FlareRiskAnalysis;
}

// 전조 증상 기반 flare 예측
export interface ProdromalFlarePrediction {
  commonScore: number; // 공통 증상 점수 (0-25)
  diseaseSpecificScore: number; // 질환별 증상 점수
  totalScore: number; // 총점
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 예상 확률 (0-100%)
  message: string;
  contributingSymptoms: string[];
}

// 증상 일지 (Flare 다이어리)
export interface FlareDiaryEntry {
  id: string;
  date: string;
  severity: number; // 1-10
  duration: number; // 일
  symptoms: string[];
  estimatedTriggers: string[]; // 유발 요인 추정
  notes?: string;
  medications?: {
    name: string;
    dosage: string;
    adherence: boolean; // 약물 순응도
  }[];
  testResults?: {
    name: string;
    value: string;
    unit?: string;
    date: string;
  }[];
}

// AI 기반 Trigger 목록
export interface FlareTrigger {
  id: string;
  name: string;
  category: 'food' | 'stress' | 'environment' | 'sleep' | 'other';
  confidence: number; // 신뢰도 (0-100%)
  frequency: number; // 발생 빈도
  lastOccurrence?: string;
  recommendation: string;
}

// 병원 리포트
export interface HospitalReport {
  period: {
    start: string;
    end: string;
  };
  flareCount: number;
  averageSeverity: number;
  topTriggers: FlareTrigger[];
  medicationAdherence: number; // 0-100%
  testResults: {
    name: string;
    values: Array<{ date: string; value: string }>;
    trend: 'improving' | 'stable' | 'worsening';
  }[];
  summary: string;
}

// 환경 정보
export interface EnvironmentalData {
  date: string;
  temperature: number; // 기온 (°C)
  humidity: number; // 습도 (%)
  pressure: number; // 기압 (hPa)
  weatherIndex: number; // 생활기상지수 (0-100)
}

export interface EnvironmentalRiskAnalysis {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    temperature: boolean;
    humidity: boolean;
    pressure: boolean;
    weatherIndex: boolean;
  };
  message: string;
  recommendations: string[];
}

// 감정 기록
export interface EmotionRecord {
  id: string;
  date: string;
  emotions: {
    depression: number; // 우울 (0-10)
    anxiety: number; // 불안 (0-10)
    stress: number; // 스트레스 (0-10)
    isolation: number; // 고립감 (0-10)
  };
  note?: string;
}

// 감정-Flare 상관 그래프 데이터
export interface EmotionFlareCorrelation {
  weekData: Array<{
    date: string;
    emotionScore: number;
    flareOccurred: boolean;
  }>;
  correlation: number;
  message: string;
}

// 스트레스 완화 루틴
export interface StressReliefRoutine {
  id: string;
  name: string;
  description: string;
  duration: number; // 분
  category: 'meditation' | 'exercise' | 'breathing' | 'music' | 'other';
  steps: string[];
}

// 커뮤니티 게시글
export interface CommunityPost {
  id: string;
  author: string;
  date: string;
  title: string;
  content: string;
  category: 'flare-management' | 'emotional-support' | 'treatment' | 'lifestyle';
  likes: number;
  comments: number;
  tags: string[];
}


