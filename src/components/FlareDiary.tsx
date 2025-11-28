import React, { useState, useEffect, useRef } from 'react';
import { Moon, Utensils, Droplet, Pill, Dumbbell, Calendar, Plus, Edit2, Camera, X, Heart } from 'lucide-react';
import { trackActivity } from '../utils/gameSystem';
import { StressRecord } from '../types';
import StressRecordForm from './StressRecordForm';
import './FlareDiary.css';

// 타입 정의
interface MealDetail {
  name: string;
  menu: string;
  image?: string;
  warningFoods?: string[];
  hasSymptom?: boolean;
  symptomTime?: number; // 증상 발생까지 시간 (분)
  symptoms?: string[];
  otherSymptom?: string;
  severity?: number; // 1-10
}

interface DailyRecord {
  id: string;
  date: string;
  sleep?: {
    totalHours: number;
    quality: number; // 1-10
  };
  meals?: {
    breakfast?: MealDetail;
    lunch?: MealDetail;
    dinner?: MealDetail;
  };
  water?: {
    current: number; // ml
    target: number; // ml
  };
  medication?: {
    times: string[];
    medications: { time: string; name: string }[];
  };
  exercise?: {
    type: string;
    duration: number; // minutes
    notes?: string;
  };
}

interface SymptomEntry {
  id: string;
  date: string;
  symptoms: { name: string; severity: 'weak' | 'medium' | 'strong' }[];
}

interface ProdromalSymptomRecord {
  id: string;
  date: string;
  commonSymptoms: {
    // 전신 증상
    fatigue?: number; // 피로감 (0-10)
    bodyTemperature?: number; // 체온 (34.5-40.0)
    bodyAche?: number; // 몸살 (0-10)
    // 정신적 변화
    anxiety?: number; // 불안감 (0-10)
    depression?: number; // 우울감 (0-10)
    stress?: number; // 스트레스 (0-10)
    sleepDisorder?: number; // 수면 장애 (0-10)
    // 소화계
    appetiteLoss?: number; // 입맛저하 (0-1)
    abdominalPain?: number; // 복통 (0-10)
    // 근골격계
    jointPain?: number; // 관절통 (0-10)
    functionalDecline?: number; // 기능저하 (0-10)
    // 피부
    skinPain?: number; // 피부통증 (0-10)
    itching?: number; // 가려움증 (0-10)
  };
  diseaseSpecific?: {
    // 류마티스 관절염
    rheumatoidArthritis?: {
      jointSwelling?: number; // 관절부기 (0-10)
      jointStiffness?: number; // 관절경직 (0-10)
      worseInMorning?: number; // 아침에 더 심한 증상 (0-1)
    };
    // 건선
    psoriasis?: {
      redness?: number; // 붉은기 (0-10)
      thickness?: number; // 두께 (0-10)
      scaling?: number; // 인설 (0-1)
    };
    // 크론병
    crohnsDisease?: {
      bowelFrequency?: number; // 배변횟수 (0-20)
      stoolConsistency?: number; // 묽은 정도 (0-10)
      bloodMucus?: number; // 혈변,점액질 (0-1)
    };
    // 제1형 당뇨병
    type1Diabetes?: {
      bloodSugarVariability?: number; // 혈당변동성 (0-100)
    };
    // 다발성 경화증
    multipleSclerosis?: {
      visionBlur?: number; // 시야 흐림 (0-1)
      balanceDisorder?: number; // 균형 장애 (0-1)
    };
    // 루푸스
    lupus?: {
      sunlightExposure?: number; // 햇빛노출시간 (0-120) 분
      facialRash?: number; // 얼굴 발진 (0-10)
      oralUlcer?: number; // 구강 궤양 (0-10)
    };
    // 쇼그렌 증후군
    sjogrensSyndrome?: {
      eyeDryness?: number; // 눈 건조 (0-10)
      mouthDryness?: number; // 구강 건조 (0-10)
    };
  };
}

const FlareDiary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'symptom'>('daily');
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [stressRecords, setStressRecords] = useState<StressRecord[]>([]);
  const [prodromalRecords, setProdromalRecords] = useState<ProdromalSymptomRecord[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  // 데이터 로드
  useEffect(() => {
    const savedDaily = localStorage.getItem('dailyRecords');
    const savedSymptoms = localStorage.getItem('symptomEntries');
    const savedStress = localStorage.getItem('flareManagementData');
    const savedProdromal = localStorage.getItem('prodromalSymptomRecords');
    const savedDiseases = localStorage.getItem('userDiseases');
    
    if (savedDaily) {
      try {
        const records = JSON.parse(savedDaily);
        setDailyRecords(records);
        const todayRec = records.find((r: DailyRecord) => r.date === today);
        if (todayRec) {
          setTodayRecord(todayRec);
        } else {
          setTodayRecord({ id: Date.now().toString(), date: today });
        }
      } catch (e) {
        console.error('Failed to load daily records:', e);
      }
    } else {
      setTodayRecord({ id: Date.now().toString(), date: today });
    }

    if (savedSymptoms) {
      try {
        setSymptomEntries(JSON.parse(savedSymptoms));
      } catch (e) {
        console.error('Failed to load symptom entries:', e);
      }
    }

    if (savedStress) {
      try {
        const data = JSON.parse(savedStress);
        setStressRecords(data.stressRecords || []);
      } catch (e) {
        console.error('Failed to load stress records:', e);
      }
    }

    if (savedProdromal) {
      try {
        setProdromalRecords(JSON.parse(savedProdromal));
      } catch (e) {
        console.error('Failed to load prodromal records:', e);
      }
    }

    if (savedDiseases) {
      try {
        setUserDiseases(JSON.parse(savedDiseases));
      } catch (e) {
        console.error('Failed to load user diseases:', e);
      }
    }
  }, []);

  // 데이터 저장
  const saveDailyRecord = (record: DailyRecord) => {
    const updated = [...dailyRecords.filter(r => r.date !== today), record];
    setDailyRecords(updated);
    setTodayRecord(record);
    localStorage.setItem('dailyRecords', JSON.stringify(updated));
    trackActivity('diary');
  };

  const saveSymptomEntry = (entry: SymptomEntry) => {
    const updated = [...symptomEntries.filter(e => e.date !== today), entry];
    setSymptomEntries(updated);
    localStorage.setItem('symptomEntries', JSON.stringify(updated));
    trackActivity('diary');
  };

  // 수면 기록
  const handleSleepUpdate = (totalHours: number, quality: number) => {
    if (!todayRecord) return;
    const updated = {
      ...todayRecord,
      sleep: { totalHours, quality }
    };
    saveDailyRecord(updated);
  };

  // 증상 일지에 추가하는 함수
  const addSymptomToDiary = (
    hasSymptom: boolean,
    symptoms?: string[],
    otherSymptom?: string,
    severity?: number
  ) => {
    if (!hasSymptom || (!symptoms || symptoms.length === 0) && !otherSymptom?.trim()) {
      return false;
    }

    const todayEntry = symptomEntries.find(e => e.date === today);
    
    // 심각도를 숫자(1-10)에서 'weak' | 'medium' | 'strong'으로 변환
    const convertSeverity = (severityNum?: number): 'weak' | 'medium' | 'strong' => {
      if (!severityNum) return 'medium';
      if (severityNum <= 3) return 'weak';
      if (severityNum <= 7) return 'medium';
      return 'strong';
    };

    const severityLevel = convertSeverity(severity);
    const newSymptoms: { name: string; severity: 'weak' | 'medium' | 'strong' }[] = [];

    // 선택된 증상들 추가
    if (symptoms && symptoms.length > 0) {
      symptoms.forEach(symptom => {
        newSymptoms.push({ name: symptom, severity: severityLevel });
      });
    }

    // 기타 증상 추가
    if (otherSymptom && otherSymptom.trim()) {
      newSymptoms.push({ name: otherSymptom.trim(), severity: severityLevel });
    }

    if (newSymptoms.length > 0) {
      if (todayEntry) {
        // 기존 증상과 합치기 (중복 제거)
        const existingSymptomNames = new Set(todayEntry.symptoms.map(s => s.name));
        const uniqueNewSymptoms = newSymptoms.filter(s => !existingSymptomNames.has(s.name));
        
        if (uniqueNewSymptoms.length > 0) {
          const updatedEntry = {
            ...todayEntry,
            symptoms: [...todayEntry.symptoms, ...uniqueNewSymptoms]
          };
          saveSymptomEntry(updatedEntry);
          return true;
        }
      } else {
        // 새로운 증상 일지 항목 생성
        const newEntry: SymptomEntry = {
          id: Date.now().toString(),
          date: today,
          symptoms: newSymptoms
        };
        saveSymptomEntry(newEntry);
        return true;
      }
    }
    return false;
  };

  // 식사 기록
  const handleMealUpdate = (
    mealType: 'breakfast' | 'lunch' | 'dinner', 
    name: string, 
    menu: string, 
    image?: string,
    warningFoods?: string[],
    hasSymptom?: boolean,
    symptomTime?: number,
    symptoms?: string[],
    otherSymptom?: string,
    severity?: number
  ) => {
    if (!todayRecord) return;
    const updated = {
      ...todayRecord,
      meals: {
        ...todayRecord.meals,
        [mealType]: { 
          name, 
          menu, 
          image,
          warningFoods,
          hasSymptom,
          symptomTime,
          symptoms,
          otherSymptom,
          severity
        }
      }
    };
    saveDailyRecord(updated);
  };

  // 수분 섭취 업데이트
  const handleWaterUpdate = (amount: number) => {
    if (!todayRecord) return;
    const current = (todayRecord.water?.current || 0) + amount;
    const updated = {
      ...todayRecord,
      water: {
        current: Math.min(current, 2000),
        target: 2000
      }
    };
    saveDailyRecord(updated);
  };

  // 약물 복용 기록
  const handleMedicationUpdate = (time: string, name: string) => {
    if (!todayRecord) return;
    const medications = todayRecord.medication?.medications || [];
    const updated = {
      ...todayRecord,
      medication: {
        times: todayRecord.medication?.times || ['오전 8시', '오후 8시'],
        medications: [...medications, { time, name }]
      }
    };
    saveDailyRecord(updated);
  };

  // 운동 기록
  const handleExerciseUpdate = (type: string, duration: number, notes?: string) => {
    if (!todayRecord) return;
    const updated = {
      ...todayRecord,
      exercise: { type, duration, notes }
    };
    saveDailyRecord(updated);
  };

  // 증상 추가
  const handleAddSymptom = (name: string, severity: 'weak' | 'medium' | 'strong') => {
    const todayEntry = symptomEntries.find(e => e.date === today);
    if (todayEntry) {
      const updated = {
        ...todayEntry,
        symptoms: [...todayEntry.symptoms, { name, severity }]
      };
      saveSymptomEntry(updated);
    } else {
      const newEntry: SymptomEntry = {
        id: Date.now().toString(),
        date: today,
        symptoms: [{ name, severity }]
      };
      saveSymptomEntry(newEntry);
    }
  };

  // 스트레스 기록 추가
  const handleAddStress = (record: StressRecord) => {
    const updated = [...stressRecords.filter(r => r.id !== record.id), record].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setStressRecords(updated);
    
    // flareManagementData에 저장
    const saved = localStorage.getItem('flareManagementData');
    let flareData: any = { flares: [], stressRecords: [], foodRecords: [], sleepRecords: [], foodCorrelations: [] };
    if (saved) {
      try {
        flareData = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load flare data:', e);
      }
    }
    flareData.stressRecords = updated;
    localStorage.setItem('flareManagementData', JSON.stringify(flareData));
    
    // 스트레스 기록 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('stressRecordsUpdated'));
    
    trackActivity('diary');
  };

  // 스트레스 기록 삭제
  const handleDeleteStress = (id: string) => {
    const updated = stressRecords.filter(r => r.id !== id);
    setStressRecords(updated);
    
    // flareManagementData에 저장
    const saved = localStorage.getItem('flareManagementData');
    let flareData: any = { flares: [], stressRecords: [], foodRecords: [], sleepRecords: [], foodCorrelations: [] };
    if (saved) {
      try {
        flareData = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load flare data:', e);
      }
    }
    flareData.stressRecords = updated;
    localStorage.setItem('flareManagementData', JSON.stringify(flareData));
    
    // 스트레스 기록 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('stressRecordsUpdated'));
  };


  // 증상 심각도 색상
  const getSeverityColor = (severity: 'weak' | 'medium' | 'strong') => {
    return severity === 'weak' ? '#d1fae5' : severity === 'medium' ? '#fef3c7' : '#fee2e2';
  };

  // 증상 심각도 텍스트
  const getSeverityText = (severity: 'weak' | 'medium' | 'strong') => {
    return severity === 'weak' ? '약함' : severity === 'medium' ? '중간' : '강함';
  };

  // 수분 섭취 진행률
  const waterProgress = todayRecord?.water ? Math.floor((todayRecord.water.current / todayRecord.water.target) * 100) : 0;
  const waterFilled = Math.floor((waterProgress / 100) * 8);

  // 식사 기록 수
  const mealCount = todayRecord?.meals ? 
    [todayRecord.meals.breakfast, todayRecord.meals.lunch, todayRecord.meals.dinner].filter(Boolean).length : 0;

  return (
    <div className="health-journal">
      {/* 헤더 - 제목만 */}
      <div className="journal-header">
        <div className="header-text-wrapper">
          <h1 className="journal-title">건강 일지</h1>
          <p className="journal-subtitle">오늘의 기록을 남겨보세요.</p>
        </div>
      </div>

      {/* 콘텐츠 영역 - 흰색 박스 */}
      <div className="journal-content-wrapper">
        {/* 날짜 표시 */}
        <div className="date-display-box">
          <span className="date-label">오늘</span>
          <span className="date-value">{todayFormatted}</span>
        </div>

        {/* 탭 */}
        <div className="journal-tabs">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              일일 기록
            </button>
            <button
              className={`tab-button ${activeTab === 'symptom' ? 'active' : ''}`}
              onClick={() => setActiveTab('symptom')}
            >
              증상 일지
            </button>
          </div>
        </div>

        {/* 일일 기록 탭 */}
        {activeTab === 'daily' && (
          <div className="daily-records">
          {/* 수면 기록 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon sleep-icon">
                <Moon size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">수면</h3>
                {todayRecord?.sleep ? (
                  <p className="card-text">
                    총 {todayRecord.sleep.totalHours}시간
                  </p>
                ) : (
                  <p className="card-text">기록 없음</p>
                )}
              </div>
              {todayRecord?.sleep && (
                <span 
                  className="status-tag"
                  style={{ background: '#d1fae5' }}
                >
                  수면질 {todayRecord.sleep.quality}/10
                </span>
              )}
            </div>
            <button className="card-action-btn" onClick={() => setShowModal('sleep')}>
              기록 수정
            </button>
          </div>

          {/* 식사 기록 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon meal-icon">
                <Utensils size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">식사</h3>
                {mealCount > 0 ? (
                  <p className="card-text">
                    {todayRecord?.meals?.breakfast && '아침, '}
                    {todayRecord?.meals?.lunch && '점심, '}
                    {todayRecord?.meals?.dinner && '저녁 '}
                    기록됨
                  </p>
                ) : (
                  <p className="card-text">기록 없음</p>
                )}
              </div>
              <span className="progress-tag">{mealCount}/3</span>
            </div>
            <div className="card-action-buttons">
              <button className="card-action-btn" onClick={() => setShowModal('meal')}>
                {mealCount < 3 ? '기록 추가' : '기록 수정'}
              </button>
              {mealCount > 0 && (
                <button className="card-action-btn btn-view" onClick={() => setShowModal('meal-view')}>
                  기록 확인
                </button>
              )}
            </div>
          </div>

          {/* 수분 섭취 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon water-icon">
                <Droplet size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">수분 섭취</h3>
                <p className="card-text">
                  {todayRecord?.water?.current || 0}ml / {todayRecord?.water?.target || 2000}ml
                </p>
              </div>
              <span className="progress-tag">{waterProgress}%</span>
            </div>
            <div className="water-progress-bar">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`water-segment ${i < waterFilled ? 'filled' : ''}`}
                />
              ))}
            </div>
            <button className="card-action-btn" onClick={() => handleWaterUpdate(200)}>
              물 한 잔 추가
            </button>
          </div>

          {/* 약물 복용 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon medication-icon">
                <Pill size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">약물 복용</h3>
                {todayRecord?.medication?.times ? (
                  <p className="card-text">{todayRecord.medication.times.join(', ')}</p>
                ) : (
                  <p className="card-text">기록 없음</p>
                )}
              </div>
              {todayRecord?.medication?.medications && todayRecord.medication.medications.length > 0 && (
                <span className="status-tag" style={{ background: '#d1fae5' }}>완료</span>
              )}
            </div>
            <div className="card-action-buttons">
              <button className="card-action-btn" onClick={() => setShowModal('medication')}>
                {todayRecord?.medication?.medications && todayRecord.medication.medications.length > 0 ? '기록 수정' : '복용 기록하기'}
              </button>
              {todayRecord?.medication?.medications && todayRecord.medication.medications.length > 0 && (
                <button className="card-action-btn btn-view" onClick={() => setShowModal('medication-view')}>
                  기록 확인
                </button>
              )}
            </div>
          </div>

          {/* 스트레스 기록 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                <Heart size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">스트레스</h3>
                {(() => {
                  const todayStress = stressRecords.find(r => r.date === today);
                  return todayStress ? (
                    <p className="card-text">기록됨</p>
                  ) : (
                    <p className="card-text">기록 없음</p>
                  );
                })()}
              </div>
              {(() => {
                const todayStress = stressRecords.find(r => r.date === today);
                if (todayStress) {
                  // 스트레스 수준에 따른 색상 결정 (0-3: 초록, 4-6: 노랑, 7-10: 빨강)
                  const getStressColor = (level: number) => {
                    if (level <= 3) return '#d1fae5'; // 초록
                    if (level <= 6) return '#fef3c7'; // 노랑
                    return '#fee2e2'; // 빨강
                  };
                  return (
                    <span 
                      className="status-tag"
                      style={{ background: getStressColor(todayStress.level) }}
                    >
                      {todayStress.level}/10
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            <div className="card-action-buttons">
              <button className="card-action-btn" onClick={() => setShowModal('stress')}>
                스트레스 기록하기
              </button>
            </div>
          </div>

          {/* 운동 */}
          <div className="record-card">
            <div className="card-header">
              <div className="card-icon exercise-icon">
                <Dumbbell size={20} />
              </div>
              <div className="card-content">
                <h3 className="card-title">운동</h3>
                {todayRecord?.exercise ? (
                  <p className="card-text">
                    {todayRecord.exercise.type} {todayRecord.exercise.duration}분
                  </p>
                ) : (
                  <p className="card-text">아직 기록 없음</p>
                )}
              </div>
            </div>
            <div className="card-action-buttons">
              <button className="card-action-btn" onClick={() => setShowModal('exercise')}>
                {todayRecord?.exercise ? '기록 수정' : '운동 기록하기'}
              </button>
              {todayRecord?.exercise && (
                <button className="card-action-btn btn-view" onClick={() => setShowModal('exercise-view')}>
                  기록 확인
                </button>
              )}
            </div>
          </div>
          </div>
        )}

        {/* 증상 일지 탭 */}
        {activeTab === 'symptom' && (
          <ProdromalSymptomDiary 
            today={today}
            prodromalRecords={prodromalRecords}
            setProdromalRecords={setProdromalRecords}
            userDiseases={userDiseases}
          />
        )}
      </div>

      {/* 모달들 */}
      {showModal === 'sleep' && (
        <SleepModal
          sleep={todayRecord?.sleep}
          onSave={(totalHours, quality) => {
            handleSleepUpdate(totalHours, quality);
            setShowModal(null);
          }}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'meal-view' && (
        <MealViewModal
          meals={todayRecord?.meals}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'meal' && (
        <MealModal
          meals={todayRecord?.meals}
          onSave={(mealType, name, menu, image, warningFoods, hasSymptom, symptomTime, symptoms, otherSymptom, severity) => {
            handleMealUpdate(mealType, name, menu, image, warningFoods, hasSymptom, symptomTime, symptoms, otherSymptom, severity);
            setShowModal(null);
          }}
          onAddSymptom={(hasSymptom, symptoms, otherSymptom, severity) => {
            addSymptomToDiary(hasSymptom, symptoms, otherSymptom, severity);
          }}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'medication' && (
        <MedicationModal
          medication={todayRecord?.medication}
          onSave={(time, name) => {
            handleMedicationUpdate(time, name);
            setShowModal(null);
          }}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'medication-view' && (
        <MedicationViewModal
          medication={todayRecord?.medication}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'exercise' && (
        <ExerciseModal
          exercise={todayRecord?.exercise}
          onSave={(type, duration, notes) => {
            handleExerciseUpdate(type, duration, notes);
            setShowModal(null);
          }}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'exercise-view' && (
        <ExerciseViewModal
          exercise={todayRecord?.exercise}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'symptom' && (
        <SymptomModal
          onSave={(name, severity) => {
            handleAddSymptom(name, severity);
            setShowModal(null);
          }}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'stress' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>스트레스 기록</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <StressRecordForm
                onAdd={handleAddStress}
                onDelete={handleDeleteStress}
                existingRecords={stressRecords}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 모달 컴포넌트들
const SleepModal: React.FC<{
  sleep?: { totalHours: number; quality: number };
  onSave: (totalHours: number, quality: number) => void;
  onClose: () => void;
}> = ({ sleep, onSave, onClose }) => {
  const [totalHours, setTotalHours] = useState(sleep?.totalHours || 7);
  const [quality, setQuality] = useState(sleep?.quality || 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>수면 기록</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>총 수면시간 (시간)</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={totalHours}
              onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
              className="form-input"
              placeholder="예: 7.5"
            />
          </div>
          <div className="form-group">
            <label>수면 질 (1-10)</label>
            <div className="quality-range">
              <input
                type="range"
                min="1"
                max="10"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="quality-slider"
              />
              <div className="quality-value">
                <span className="quality-number">{quality}</span>
                <span className="quality-label">/ 10</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => onSave(totalHours, quality)}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const MealModal: React.FC<{
  meals?: {
    breakfast?: MealDetail;
    lunch?: MealDetail;
    dinner?: MealDetail;
  };
  onSave: (
    mealType: 'breakfast' | 'lunch' | 'dinner', 
    name: string, 
    menu: string, 
    image?: string,
    warningFoods?: string[],
    hasSymptom?: boolean,
    symptomTime?: number,
    symptoms?: string[],
    otherSymptom?: string,
    severity?: number
  ) => void;
  onAddSymptom: (
    hasSymptom: boolean,
    symptoms?: string[],
    otherSymptom?: string,
    severity?: number
  ) => void;
  onClose: () => void;
}> = ({ meals, onSave, onAddSymptom, onClose }) => {
  const WARNING_FOODS = ['우유', '달걀', '밀', '호두/땅콩', '메밀', '새우', '대두', '해산물', '과일류', '고기류'];
  const SYMPTOMS = ['피로감', '소화불량', '복통', '두통', '발진', '가려움', '붓기', '관절통', '메스꺼움'];
  
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [menu, setMenu] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [warningFoods, setWarningFoods] = useState<string[]>([]);
  const [hasSymptom, setHasSymptom] = useState(false);
  const [symptomTime, setSymptomTime] = useState(30);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 앱 재시작 시 체크 항목 초기화
  useEffect(() => {
    // 세션이 새로 시작되었는지 확인
    const sessionKey = 'appSessionId';
    const currentSessionId = sessionStorage.getItem(sessionKey);
    const newSessionId = Date.now().toString();
    
    if (!currentSessionId || currentSessionId !== newSessionId) {
      // 새 세션이면 초기화
      sessionStorage.setItem(sessionKey, newSessionId);
      setSelectedSymptoms([]);
      setWarningFoods([]);
      setHasSymptom(false);
      setOtherSymptom('');
    }
  }, []);

  // 선택된 식사 타입에 따라 기존 데이터 로드
  useEffect(() => {
    const currentMeal = meals?.[mealType];
    if (currentMeal) {
      setMenu(currentMeal.menu || '');
      setImagePreview(currentMeal.image || null);
      setWarningFoods(currentMeal.warningFoods || []);
      setHasSymptom(currentMeal.hasSymptom || false);
      setSymptomTime(currentMeal.symptomTime || 30);
      setSelectedSymptoms(currentMeal.symptoms || []);
      setOtherSymptom(currentMeal.otherSymptom || '');
      setSeverity(currentMeal.severity || 5);
    } else {
      setMenu('');
      setImagePreview(null);
      setWarningFoods([]);
      setHasSymptom(false);
      setSymptomTime(30);
      setSelectedSymptoms([]);
      setOtherSymptom('');
      setSeverity(5);
    }
  }, [mealType, meals]);

  const handleWarningFoodToggle = (food: string) => {
    setWarningFoods(prev => 
      prev.includes(food) 
        ? prev.filter(f => f !== food)
        : [...prev, food]
    );
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddOtherSymptom = () => {
    if (otherSymptom.trim()) {
      // 기타 증상을 선택된 증상 목록에 추가
      if (!selectedSymptoms.includes(otherSymptom.trim())) {
        setSelectedSymptoms(prev => [...prev, otherSymptom.trim()]);
      }
      setOtherSymptom('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>식사 기록</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>식사 종류</label>
            <div className="meal-type-buttons">
              <button
                className={`meal-type-btn ${mealType === 'breakfast' ? 'active' : ''}`}
                onClick={() => setMealType('breakfast')}
              >
                아침
              </button>
              <button
                className={`meal-type-btn ${mealType === 'lunch' ? 'active' : ''}`}
                onClick={() => setMealType('lunch')}
              >
                점심
              </button>
              <button
                className={`meal-type-btn ${mealType === 'dinner' ? 'active' : ''}`}
                onClick={() => setMealType('dinner')}
              >
                저녁
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>메뉴</label>
            <textarea
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              placeholder="메뉴를 입력하세요"
              className="form-textarea"
              rows={3}
            />
          </div>
          <div className="form-group">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button className="upload-btn" onClick={handleUploadClick}>
              <Camera size={16} />
              사진 업로드
            </button>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="식사 사진" />
                <button 
                  className="remove-image-btn"
                  onClick={() => setImagePreview(null)}
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>섭취한 주의 식품</label>
            <div className="warning-foods-grid">
              {WARNING_FOODS.map(food => (
                <label key={food} className="warning-food-checkbox">
                  <input
                    type="checkbox"
                    checked={warningFoods.includes(food)}
                    onChange={() => handleWarningFoodToggle(food)}
                  />
                  <span>{food}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={hasSymptom}
                onChange={(e) => setHasSymptom(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              섭취후 증상이 있었나요?
            </label>
            {!hasSymptom && (
              <button
                onClick={() => {
                  // 증상이 없을 때는 식사 기록만 저장
                  onSave(
                    mealType, 
                    `${mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'}식사`, 
                    menu || '식사 기록', 
                    imagePreview || undefined,
                    warningFoods.length > 0 ? warningFoods : undefined,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined
                  );
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                }}
              >
                기록 추가
              </button>
            )}
          </div>

          {hasSymptom && (
            <>
              <div className="form-group">
                <label>증상 발생까지 시간 (분)</label>
                <input
                  type="number"
                  min="0"
                  value={symptomTime}
                  onChange={(e) => setSymptomTime(parseInt(e.target.value) || 0)}
                  className="form-input"
                  placeholder="예: 30"
                />
              </div>

              <div className="form-group">
                <label>증상</label>
                <div className="symptoms-grid">
                  {SYMPTOMS.map(symptom => (
                    <label key={symptom} className="symptom-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSymptoms.includes(symptom)}
                        onChange={() => handleSymptomToggle(symptom)}
                      />
                      <span>{symptom}</span>
                    </label>
                  ))}
                  {/* 추가된 기타 증상들 표시 */}
                  {selectedSymptoms
                    .filter(symptom => !SYMPTOMS.includes(symptom))
                    .map(symptom => (
                      <label key={symptom} className="symptom-checkbox" style={{ background: '#f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleSymptomToggle(symptom)}
                        />
                        <span>{symptom}</span>
                      </label>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={otherSymptom}
                    onChange={(e) => setOtherSymptom(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOtherSymptom();
                      }
                    }}
                    placeholder="기타 증상 입력"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={handleAddOtherSymptom}
                    disabled={!otherSymptom.trim()}
                    style={{
                      padding: '10px 16px',
                      background: otherSymptom.trim() ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: otherSymptom.trim() ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    추가
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>증상 심각도 (1-10)</label>
                <div className="quality-range">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(parseInt(e.target.value))}
                    className="quality-slider"
                  />
                  <div className="quality-value">
                    <span className="quality-number">{severity}</span>
                    <span className="quality-label">/ 10</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    // 모든 증상 수집 (선택된 증상 + 기타 증상)
                    const allSymptoms = [...selectedSymptoms];
                    if (otherSymptom.trim() && !allSymptoms.includes(otherSymptom.trim())) {
                      allSymptoms.push(otherSymptom.trim());
                    }
                    
                    // 식사 기록 저장
                    onSave(
                      mealType, 
                      `${mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'}식사`, 
                      menu || '식사 기록', 
                      imagePreview || undefined,
                      warningFoods.length > 0 ? warningFoods : undefined,
                      true,
                      symptomTime,
                      allSymptoms.length > 0 ? allSymptoms : undefined,
                      undefined, // otherSymptom은 이미 allSymptoms에 포함됨
                      severity
                    );
                    
                    // 증상 일지에 추가
                    if (allSymptoms.length > 0) {
                      onAddSymptom(true, allSymptoms, undefined, severity);
                    }
                    
                    // 모달 닫기
                    onClose();
                  }}
                  disabled={selectedSymptoms.length === 0 && !otherSymptom.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: (selectedSymptoms.length > 0 || otherSymptom.trim()) 
                      ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' 
                      : '#e5e7eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: (selectedSymptoms.length > 0 || otherSymptom.trim()) ? 'pointer' : 'not-allowed',
                    boxShadow: (selectedSymptoms.length > 0 || otherSymptom.trim()) 
                      ? '0 4px 12px rgba(124, 58, 237, 0.3)' 
                      : 'none'
                  }}
                >
                  기록 추가
                </button>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button 
            className="btn-save" 
            onClick={() => {
              onSave(
                mealType, 
                `${mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'}식사`, 
                menu || '식사 기록', 
                imagePreview || undefined,
                warningFoods.length > 0 ? warningFoods : undefined,
                hasSymptom || undefined,
                hasSymptom ? symptomTime : undefined,
                hasSymptom && selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
                hasSymptom && otherSymptom ? otherSymptom : undefined,
                hasSymptom ? severity : undefined
              );
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const MedicationModal: React.FC<{
  medication?: { times: string[]; medications: { time: string; name: string }[] };
  onSave: (time: string, name: string) => void;
  onClose: () => void;
}> = ({ medication, onSave, onClose }) => {
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'오전' | '오후'>('오전');
  const [name, setName] = useState('');

  const formatTime = () => {
    return `${ampm} ${hour}시 ${minute}분`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>약물 복용 기록</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>복용 시간</label>
            <div className="time-selector">
              <select
                value={ampm}
                onChange={(e) => setAmpm(e.target.value as '오전' | '오후')}
                className="form-input time-select"
              >
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <select
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
                className="form-input time-select"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
              <select
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value))}
                className="form-input time-select"
              >
                {[0, 10, 20, 30, 40, 50].map(m => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>약물명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="약물명을 입력하세요"
              className="form-input"
            />
          </div>
          {medication?.medications && medication.medications.length > 0 && (
            <div className="medication-list">
              <h4>오늘의 복용 기록</h4>
              {medication.medications.map((med, idx) => (
                <div key={idx} className="medication-item">
                  <span>{med.time}</span>
                  <span>{med.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => {
            if (name) {
              onSave(formatTime(), name);
            }
          }}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const ExerciseModal: React.FC<{
  exercise?: { type: string; duration: number; notes?: string };
  onSave: (type: string, duration: number, notes?: string) => void;
  onClose: () => void;
}> = ({ exercise, onSave, onClose }) => {
  const [type, setType] = useState(exercise?.type || '');
  const [duration, setDuration] = useState(exercise?.duration || 20);
  const [notes, setNotes] = useState(exercise?.notes || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>운동 기록</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>운동 종류</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="예: 걷기, 요가, 수영"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>운동 시간 (분)</label>
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="운동에 대한 메모를 입력하세요"
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => {
            if (type && duration > 0) {
              onSave(type, duration, notes);
            }
          }}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const SymptomModal: React.FC<{
  onSave: (name: string, severity: 'weak' | 'medium' | 'strong') => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState<'weak' | 'medium' | 'strong'>('medium');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  // 앱 재시작 시 체크 항목 초기화
  useEffect(() => {
    const sessionKey = 'appSessionId';
    const currentSessionId = sessionStorage.getItem(sessionKey);
    const newSessionId = Date.now().toString();
    
    if (!currentSessionId || currentSessionId !== newSessionId) {
      setSelectedSymptom(null);
      setName('');
    }
  }, []);

  const symptomGroups = [
    {
      category: '관절 및 통증',
      symptoms: ['관절통', '근육통', '붓기'],
      color: '#7c3aed'
    },
    {
      category: '전신 증상',
      symptoms: ['피로감', '열'],
      color: '#ec4899'
    },
    {
      category: '피부 증상',
      symptoms: ['발진', '가려움'],
      color: '#f59e0b'
    },
    {
      category: '신경 증상',
      symptoms: ['두통', '인지장애'],
      color: '#3b82f6'
    },
    {
      category: '기타',
      symptoms: ['소화불량', '호흡곤란'],
      color: '#10b981'
    }
  ];

  const handleSymptomSelect = (symptom: string) => {
    setName(symptom);
    setSelectedSymptom(symptom);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content symptom-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>증상 추가</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">증상 선택</label>
            <p className="form-hint">자주 나타나는 증상을 선택하거나 직접 입력하세요</p>
            <div className="symptom-groups-container">
              {symptomGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="symptom-group">
                  <div 
                    className="symptom-group-header"
                    style={{ borderLeftColor: group.color }}
                  >
                    <span className="symptom-group-title">{group.category}</span>
                  </div>
                  <div className="symptom-group-buttons">
                    {group.symptoms.map(symptom => (
                      <button
                        key={symptom}
                        className={`symptom-suggestion-btn ${selectedSymptom === symptom ? 'selected' : ''}`}
                        onClick={() => handleSymptomSelect(symptom)}
                        style={{
                          '--group-color': group.color
                        } as React.CSSProperties}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="custom-symptom-input-wrapper">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSelectedSymptom(null);
                }}
                placeholder="직접 입력하기"
                className="form-input symptom-custom-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">심각도</label>
            <p className="form-hint">증상의 강도를 선택하세요</p>
            <div className="severity-buttons-grid">
              <button
                className={`severity-btn severity-weak ${severity === 'weak' ? 'active' : ''}`}
                onClick={() => setSeverity('weak')}
              >
                <span className="severity-icon">😐</span>
                <span className="severity-label">약함</span>
              </button>
              <button
                className={`severity-btn severity-medium ${severity === 'medium' ? 'active' : ''}`}
                onClick={() => setSeverity('medium')}
              >
                <span className="severity-icon">😟</span>
                <span className="severity-label">중간</span>
              </button>
              <button
                className={`severity-btn severity-strong ${severity === 'strong' ? 'active' : ''}`}
                onClick={() => setSeverity('strong')}
              >
                <span className="severity-icon">😰</span>
                <span className="severity-label">강함</span>
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className={`btn-save ${!name ? 'disabled' : ''}`}
            onClick={() => {
              if (name) {
                onSave(name, severity);
              }
            }}
            disabled={!name}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const MealViewModal: React.FC<{
  meals?: {
    breakfast?: MealDetail;
    lunch?: MealDetail;
    dinner?: MealDetail;
  };
  onClose: () => void;
}> = ({ meals, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>식사 기록 확인</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {meals?.breakfast && (
            <div className="meal-view-item">
              <h4 className="meal-view-title">아침</h4>
              <p className="meal-view-menu">{meals.breakfast.menu}</p>
              {meals.breakfast.image && (
                <div className="meal-view-image">
                  <img src={meals.breakfast.image} alt="아침 식사" />
                </div>
              )}
              {meals.breakfast.warningFoods && meals.breakfast.warningFoods.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>주의 식품: </strong>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {meals.breakfast.warningFoods.join(', ')}
                  </span>
                </div>
              )}
              {meals.breakfast.hasSymptom && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>증상 기록</strong>
                  {meals.breakfast.symptomTime && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상 발생까지 시간: {meals.breakfast.symptomTime}분
                    </p>
                  )}
                  {meals.breakfast.symptoms && meals.breakfast.symptoms.length > 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상: {meals.breakfast.symptoms.join(', ')}
                    </p>
                  )}
                  {meals.breakfast.otherSymptom && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      기타 증상: {meals.breakfast.otherSymptom}
                    </p>
                  )}
                  {meals.breakfast.severity && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      심각도: {meals.breakfast.severity}/10
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {meals?.lunch && (
            <div className="meal-view-item">
              <h4 className="meal-view-title">점심</h4>
              <p className="meal-view-menu">{meals.lunch.menu}</p>
              {meals.lunch.image && (
                <div className="meal-view-image">
                  <img src={meals.lunch.image} alt="점심 식사" />
                </div>
              )}
              {meals.lunch.warningFoods && meals.lunch.warningFoods.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>주의 식품: </strong>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {meals.lunch.warningFoods.join(', ')}
                  </span>
                </div>
              )}
              {meals.lunch.hasSymptom && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>증상 기록</strong>
                  {meals.lunch.symptomTime && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상 발생까지 시간: {meals.lunch.symptomTime}분
                    </p>
                  )}
                  {meals.lunch.symptoms && meals.lunch.symptoms.length > 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상: {meals.lunch.symptoms.join(', ')}
                    </p>
                  )}
                  {meals.lunch.otherSymptom && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      기타 증상: {meals.lunch.otherSymptom}
                    </p>
                  )}
                  {meals.lunch.severity && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      심각도: {meals.lunch.severity}/10
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {meals?.dinner && (
            <div className="meal-view-item">
              <h4 className="meal-view-title">저녁</h4>
              <p className="meal-view-menu">{meals.dinner.menu}</p>
              {meals.dinner.image && (
                <div className="meal-view-image">
                  <img src={meals.dinner.image} alt="저녁 식사" />
                </div>
              )}
              {meals.dinner.warningFoods && meals.dinner.warningFoods.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>주의 식품: </strong>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {meals.dinner.warningFoods.join(', ')}
                  </span>
                </div>
              )}
              {meals.dinner.hasSymptom && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>증상 기록</strong>
                  {meals.dinner.symptomTime && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상 발생까지 시간: {meals.dinner.symptomTime}분
                    </p>
                  )}
                  {meals.dinner.symptoms && meals.dinner.symptoms.length > 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      증상: {meals.dinner.symptoms.join(', ')}
                    </p>
                  )}
                  {meals.dinner.otherSymptom && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      기타 증상: {meals.dinner.otherSymptom}
                    </p>
                  )}
                  {meals.dinner.severity && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0' }}>
                      심각도: {meals.dinner.severity}/10
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!meals?.breakfast && !meals?.lunch && !meals?.dinner && (
            <p className="meal-view-empty">기록된 식사가 없습니다.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const MedicationViewModal: React.FC<{
  medication?: { times: string[]; medications: { time: string; name: string }[] };
  onClose: () => void;
}> = ({ medication, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>약물 복용 기록 확인</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {medication?.medications && medication.medications.length > 0 ? (
            <div className="medication-view-item">
              <h4 className="medication-view-title">오늘의 복용 기록</h4>
              <div className="medication-view-list">
                {medication.medications.map((med, idx) => (
                  <div key={idx} className="medication-view-record">
                    <div className="medication-view-time">{med.time}</div>
                    <div className="medication-view-name">{med.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="meal-view-empty">기록된 약물 복용이 없습니다.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const ExerciseViewModal: React.FC<{
  exercise?: { type: string; duration: number; notes?: string };
  onClose: () => void;
}> = ({ exercise, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>운동 기록 확인</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {exercise ? (
            <div className="exercise-view-item">
              <div className="exercise-view-section">
                <h4 className="exercise-view-label">운동 종류</h4>
                <p className="exercise-view-value">{exercise.type}</p>
              </div>
              <div className="exercise-view-section">
                <h4 className="exercise-view-label">운동 시간</h4>
                <p className="exercise-view-value">{exercise.duration}분</p>
              </div>
              {exercise.notes && (
                <div className="exercise-view-section">
                  <h4 className="exercise-view-label">메모</h4>
                  <p className="exercise-view-value exercise-view-notes">{exercise.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="meal-view-empty">기록된 운동이 없습니다.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// 전조 증상 일지 컴포넌트
const ProdromalSymptomDiary: React.FC<{
  today: string;
  prodromalRecords: ProdromalSymptomRecord[];
  setProdromalRecords: React.Dispatch<React.SetStateAction<ProdromalSymptomRecord[]>>;
  userDiseases: string[];
}> = ({ today, prodromalRecords, setProdromalRecords, userDiseases }) => {
  const todayRecord = prodromalRecords.find(r => r.date === today);
  
  const [commonSymptoms, setCommonSymptoms] = useState({
    // 전신 증상
    fatigue: todayRecord?.commonSymptoms?.fatigue ?? 0,
    bodyTemperature: todayRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
    bodyAche: todayRecord?.commonSymptoms?.bodyAche ?? 0,
    // 정신적 변화
    anxiety: todayRecord?.commonSymptoms?.anxiety ?? 0,
    depression: todayRecord?.commonSymptoms?.depression ?? 0,
    stress: todayRecord?.commonSymptoms?.stress ?? 0,
    sleepDisorder: todayRecord?.commonSymptoms?.sleepDisorder ?? 0,
    // 소화계
    appetiteLoss: todayRecord?.commonSymptoms?.appetiteLoss ?? 0,
    abdominalPain: todayRecord?.commonSymptoms?.abdominalPain ?? 0,
    // 근골격계
    jointPain: todayRecord?.commonSymptoms?.jointPain ?? 0,
    functionalDecline: todayRecord?.commonSymptoms?.functionalDecline ?? 0,
    // 피부
    skinPain: todayRecord?.commonSymptoms?.skinPain ?? 0,
    itching: todayRecord?.commonSymptoms?.itching ?? 0,
  });

  const [diseaseSpecific, setDiseaseSpecific] = useState<any>(todayRecord?.diseaseSpecific || {});

  // 오늘 날짜의 기록이 로드될 때 상태 업데이트
  useEffect(() => {
    const record = prodromalRecords.find(r => r.date === today);
    if (record) {
      setCommonSymptoms({
        fatigue: record.commonSymptoms?.fatigue ?? 0,
        bodyTemperature: record.commonSymptoms?.bodyTemperature ?? 36.5,
        bodyAche: record.commonSymptoms?.bodyAche ?? 0,
        anxiety: record.commonSymptoms?.anxiety ?? 0,
        depression: record.commonSymptoms?.depression ?? 0,
        stress: record.commonSymptoms?.stress ?? 0,
        sleepDisorder: record.commonSymptoms?.sleepDisorder ?? 0,
        appetiteLoss: record.commonSymptoms?.appetiteLoss ?? 0,
        abdominalPain: record.commonSymptoms?.abdominalPain ?? 0,
        jointPain: record.commonSymptoms?.jointPain ?? 0,
        functionalDecline: record.commonSymptoms?.functionalDecline ?? 0,
        skinPain: record.commonSymptoms?.skinPain ?? 0,
        itching: record.commonSymptoms?.itching ?? 0,
      });
      setDiseaseSpecific(record.diseaseSpecific || {});
    } else {
      setCommonSymptoms({
        fatigue: 0,
        bodyTemperature: 36.5,
        bodyAche: 0,
        anxiety: 0,
        depression: 0,
        stress: 0,
        sleepDisorder: 0,
        appetiteLoss: 0,
        abdominalPain: 0,
        jointPain: 0,
        functionalDecline: 0,
        skinPain: 0,
        itching: 0,
      });
      setDiseaseSpecific({});
    }
  }, [today, prodromalRecords]);

  const saveRecord = () => {
    // commonSymptoms 객체 생성 (값이 있으면 저장, 없으면 undefined)
    const commonSymptomsData: any = {};
    if (commonSymptoms.fatigue > 0) commonSymptomsData.fatigue = commonSymptoms.fatigue;
    if (commonSymptoms.bodyTemperature !== 36.5) commonSymptomsData.bodyTemperature = commonSymptoms.bodyTemperature;
    if (commonSymptoms.bodyAche > 0) commonSymptomsData.bodyAche = commonSymptoms.bodyAche;
    if (commonSymptoms.anxiety > 0) commonSymptomsData.anxiety = commonSymptoms.anxiety;
    if (commonSymptoms.depression > 0) commonSymptomsData.depression = commonSymptoms.depression;
    if (commonSymptoms.stress > 0) commonSymptomsData.stress = commonSymptoms.stress;
    if (commonSymptoms.sleepDisorder > 0) commonSymptomsData.sleepDisorder = commonSymptoms.sleepDisorder;
    if (commonSymptoms.appetiteLoss > 0) commonSymptomsData.appetiteLoss = commonSymptoms.appetiteLoss;
    if (commonSymptoms.abdominalPain > 0) commonSymptomsData.abdominalPain = commonSymptoms.abdominalPain;
    if (commonSymptoms.jointPain > 0) commonSymptomsData.jointPain = commonSymptoms.jointPain;
    if (commonSymptoms.functionalDecline > 0) commonSymptomsData.functionalDecline = commonSymptoms.functionalDecline;
    if (commonSymptoms.skinPain > 0) commonSymptomsData.skinPain = commonSymptoms.skinPain;
    if (commonSymptoms.itching > 0) commonSymptomsData.itching = commonSymptoms.itching;

    // 최소한 하나의 값이라도 있어야 저장
    const hasCommonSymptoms = Object.keys(commonSymptomsData).length > 0;
    const hasDiseaseSpecific = Object.keys(diseaseSpecific).length > 0;

    if (!hasCommonSymptoms && !hasDiseaseSpecific) {
      alert('최소한 하나의 증상을 입력해주세요.');
      return;
    }

    const record: ProdromalSymptomRecord = {
      id: todayRecord?.id || Date.now().toString(),
      date: today,
      commonSymptoms: hasCommonSymptoms ? commonSymptomsData : undefined,
      diseaseSpecific: hasDiseaseSpecific ? diseaseSpecific : undefined
    };

    const updated = [...prodromalRecords.filter(r => r.date !== today), record];
    setProdromalRecords(updated);
    localStorage.setItem('prodromalSymptomRecords', JSON.stringify(updated));
    
    console.log('Saved prodromal record:', record);
    console.log('All records:', updated);
    
    // AI 분석 컴포넌트에 업데이트 알림 (CustomEvent 사용)
    const event = new CustomEvent('prodromalSymptomRecordsUpdated', { 
      detail: { record, allRecords: updated } 
    });
    window.dispatchEvent(event);
    
    // 저장 후 알림
    alert('기록이 저장되었습니다.');
  };

  // 질환별 전조 증상 컴포넌트
  const renderDiseaseSpecificSymptoms = () => {
    if (userDiseases.length === 0) return null;

    return userDiseases.map(disease => {
      // 류마티스 관절염
      if (disease === '류마티스 관절염') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>류마티스 관절염 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>관절부기 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.rheumatoidArthritis?.jointSwelling || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  rheumatoidArthritis: {
                    ...diseaseSpecific.rheumatoidArthritis,
                    jointSwelling: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.rheumatoidArthritis?.jointSwelling || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>관절경직 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.rheumatoidArthritis?.jointStiffness || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  rheumatoidArthritis: {
                    ...diseaseSpecific.rheumatoidArthritis,
                    jointStiffness: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.rheumatoidArthritis?.jointStiffness || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(diseaseSpecific.rheumatoidArthritis?.worseInMorning || 0) === 1}
                  onChange={(e) => setDiseaseSpecific({
                    ...diseaseSpecific,
                    rheumatoidArthritis: {
                      ...diseaseSpecific.rheumatoidArthritis,
                      worseInMorning: e.target.checked ? 1 : 0
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                아침에 더 심한 증상
              </label>
            </div>
          </div>
        );
      }

      // 건선
      if (disease === '건선') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>건선 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>붉은기 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.psoriasis?.redness || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  psoriasis: {
                    ...diseaseSpecific.psoriasis,
                    redness: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.psoriasis?.redness || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>두께 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.psoriasis?.thickness || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  psoriasis: {
                    ...diseaseSpecific.psoriasis,
                    thickness: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.psoriasis?.thickness || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(diseaseSpecific.psoriasis?.scaling || 0) === 1}
                  onChange={(e) => setDiseaseSpecific({
                    ...diseaseSpecific,
                    psoriasis: {
                      ...diseaseSpecific.psoriasis,
                      scaling: e.target.checked ? 1 : 0
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                인설
              </label>
            </div>
          </div>
        );
      }

      // 크론병
      if (disease === '크론병') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>크론병 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>배변횟수 (0-20)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={diseaseSpecific.crohnsDisease?.bowelFrequency || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  crohnsDisease: {
                    ...diseaseSpecific.crohnsDisease,
                    bowelFrequency: parseInt(e.target.value) || 0
                  }
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>묽은 정도 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.crohnsDisease?.stoolConsistency || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  crohnsDisease: {
                    ...diseaseSpecific.crohnsDisease,
                    stoolConsistency: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.crohnsDisease?.stoolConsistency || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(diseaseSpecific.crohnsDisease?.bloodMucus || 0) === 1}
                  onChange={(e) => setDiseaseSpecific({
                    ...diseaseSpecific,
                    crohnsDisease: {
                      ...diseaseSpecific.crohnsDisease,
                      bloodMucus: e.target.checked ? 1 : 0
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                혈변, 점액질
              </label>
            </div>
          </div>
        );
      }

      // 제1형 당뇨병
      if (disease === '제1형 당뇨병') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>제1형 당뇨병 전조 증상</h3>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>혈당변동성 (0-100%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={diseaseSpecific.type1Diabetes?.bloodSugarVariability || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  type1Diabetes: {
                    ...diseaseSpecific.type1Diabetes,
                    bloodSugarVariability: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0%</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.type1Diabetes?.bloodSugarVariability || 0}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );
      }

      // 다발성 경화증(MS)
      if (disease === '다발성 경화증(MS)') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>다발성 경화증 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(diseaseSpecific.multipleSclerosis?.visionBlur || 0) === 1}
                  onChange={(e) => setDiseaseSpecific({
                    ...diseaseSpecific,
                    multipleSclerosis: {
                      ...diseaseSpecific.multipleSclerosis,
                      visionBlur: e.target.checked ? 1 : 0
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                시야 흐림
              </label>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(diseaseSpecific.multipleSclerosis?.balanceDisorder || 0) === 1}
                  onChange={(e) => setDiseaseSpecific({
                    ...diseaseSpecific,
                    multipleSclerosis: {
                      ...diseaseSpecific.multipleSclerosis,
                      balanceDisorder: e.target.checked ? 1 : 0
                    }
                  })}
                  style={{ marginRight: '8px' }}
                />
                균형 장애
              </label>
            </div>
          </div>
        );
      }

      // 루푸스(SLE)
      if (disease === '루푸스(SLE)') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>루푸스 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>햇빛노출시간 (0-120분)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={diseaseSpecific.lupus?.sunlightExposure || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  lupus: {
                    ...diseaseSpecific.lupus,
                    sunlightExposure: parseInt(e.target.value) || 0
                  }
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                placeholder="분 단위"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>얼굴 발진 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.lupus?.facialRash || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  lupus: {
                    ...diseaseSpecific.lupus,
                    facialRash: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.lupus?.facialRash || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>구강 궤양 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.lupus?.oralUlcer || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  lupus: {
                    ...diseaseSpecific.lupus,
                    oralUlcer: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.lupus?.oralUlcer || 0}</span>
                <span>10</span>
              </div>
            </div>
          </div>
        );
      }

      // 쇼그렌 증후군
      if (disease === '쇼그렌 증후군') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>쇼그렌 증후군 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>눈 건조 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.sjogrensSyndrome?.eyeDryness || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  sjogrensSyndrome: {
                    ...diseaseSpecific.sjogrensSyndrome,
                    eyeDryness: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.sjogrensSyndrome?.eyeDryness || 0}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>구강 건조 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={diseaseSpecific.sjogrensSyndrome?.mouthDryness || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  sjogrensSyndrome: {
                    ...diseaseSpecific.sjogrensSyndrome,
                    mouthDryness: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.sjogrensSyndrome?.mouthDryness || 0}</span>
                <span>10</span>
              </div>
            </div>
          </div>
        );
      }

      // 자가면역성 갑상선 질환
      if (disease === '자가면역성 갑상선 질환') {
        return (
          <div key={disease} className="disease-symptom-section" style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>자가면역성 갑상선 질환 전조 증상</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>맥박 (회/분)</label>
              <input
                type="number"
                min="0"
                value={diseaseSpecific.autoimmuneThyroid?.pulse || ''}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    pulse: parseInt(e.target.value) || 0
                  }
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                placeholder="예: 72"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>체온 (°C)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={diseaseSpecific.autoimmuneThyroid?.bodyTemperature || ''}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    bodyTemperature: parseFloat(e.target.value) || 0
                  }
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                placeholder="예: 36.5"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>체중 변화 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={diseaseSpecific.autoimmuneThyroid?.weightChange || ''}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    weightChange: parseFloat(e.target.value) || 0
                  }
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                placeholder="예: +2.5 또는 -1.0"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>불면 정도 (0-5)</label>
              <input
                type="range"
                min="0"
                max="5"
                value={diseaseSpecific.autoimmuneThyroid?.insomnia || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    insomnia: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.autoimmuneThyroid?.insomnia || 0}</span>
                <span>5</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>괴민 정도 (0-5)</label>
              <input
                type="range"
                min="0"
                max="5"
                value={diseaseSpecific.autoimmuneThyroid?.irritability || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    irritability: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.autoimmuneThyroid?.irritability || 0}</span>
                <span>5</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>무기력 정도 (0-5)</label>
              <input
                type="range"
                min="0"
                max="5"
                value={diseaseSpecific.autoimmuneThyroid?.lethargy || 0}
                onChange={(e) => setDiseaseSpecific({
                  ...diseaseSpecific,
                  autoimmuneThyroid: {
                    ...diseaseSpecific.autoimmuneThyroid,
                    lethargy: parseInt(e.target.value)
                  }
                })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{diseaseSpecific.autoimmuneThyroid?.lethargy || 0}</span>
                <span>5</span>
              </div>
            </div>
          </div>
        );
      }

      return null;
    });
  };

  // 저장된 기록 표시
  const renderSavedRecord = () => {
    if (!todayRecord) return null;

    const cs = todayRecord.commonSymptoms;
    const hasAnySymptom = 
      (cs?.fatigue && cs.fatigue > 0) ||
      (cs?.bodyTemperature && cs.bodyTemperature !== 36.5) ||
      (cs?.bodyAche && cs.bodyAche > 0) ||
      (cs?.anxiety && cs.anxiety > 0) ||
      (cs?.depression && cs.depression > 0) ||
      (cs?.stress && cs.stress > 0) ||
      (cs?.sleepDisorder && cs.sleepDisorder > 0) ||
      (cs?.appetiteLoss && cs.appetiteLoss > 0) ||
      (cs?.abdominalPain && cs.abdominalPain > 0) ||
      (cs?.jointPain && cs.jointPain > 0) ||
      (cs?.functionalDecline && cs.functionalDecline > 0) ||
      (cs?.skinPain && cs.skinPain > 0) ||
      (cs?.itching && cs.itching > 0);

    if (!hasAnySymptom) return null;

    return (
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>오늘의 기록</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cs?.fatigue && cs.fatigue > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>피로감:</strong> {cs.fatigue}/10
            </div>
          )}
          {cs?.bodyTemperature && cs.bodyTemperature !== 36.5 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>체온:</strong> {cs.bodyTemperature}°C
            </div>
          )}
          {cs?.bodyAche && cs.bodyAche > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>몸살:</strong> {cs.bodyAche}/10
            </div>
          )}
          {cs?.anxiety && cs.anxiety > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>불안감:</strong> {cs.anxiety}/10
            </div>
          )}
          {cs?.depression && cs.depression > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>우울감:</strong> {cs.depression}/10
            </div>
          )}
          {cs?.stress && cs.stress > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>스트레스:</strong> {cs.stress}/10
            </div>
          )}
          {cs?.sleepDisorder && cs.sleepDisorder > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>수면 장애:</strong> {cs.sleepDisorder}/10
            </div>
          )}
          {cs?.appetiteLoss && cs.appetiteLoss > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>입맛저하:</strong> 있음
            </div>
          )}
          {cs?.abdominalPain && cs.abdominalPain > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>복통:</strong> {cs.abdominalPain}/10
            </div>
          )}
          {cs?.jointPain && cs.jointPain > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>관절통:</strong> {cs.jointPain}/10
            </div>
          )}
          {cs?.functionalDecline && cs.functionalDecline > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>기능저하:</strong> {cs.functionalDecline}/10
            </div>
          )}
          {cs?.skinPain && cs.skinPain > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>피부통증:</strong> {cs.skinPain}/10
            </div>
          )}
          {cs?.itching && cs.itching > 0 && (
            <div style={{ fontSize: '0.9rem' }}>
              <strong>가려움증:</strong> {cs.itching}/10
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="symptom-diary">
      <div className="symptom-section">
        <h2 className="section-title">Flare-up 전조 증상</h2>
        <p className="section-subtitle">오늘 느낀 증상을 기록해주세요</p>

        {/* 저장된 기록 표시 */}
        {renderSavedRecord()}

        {/* 공통 전조 증상 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {/* 1. 전신 증상 */}
          <div className="symptom-category-card" style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>
              1. 전신 증상
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>피로감 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.fatigue}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, fatigue: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.fatigue}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>체온 (34.5-40.0°C)</label>
              <input
                type="number"
                min="34.5"
                max="40.0"
                step="0.1"
                value={commonSymptoms.bodyTemperature}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, bodyTemperature: parseFloat(e.target.value) || 36.5 })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>몸살 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.bodyAche}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, bodyAche: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.bodyAche}</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* 2. 정신적 변화 */}
          <div className="symptom-category-card" style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>
              2. 정신적 변화
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>불안감 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.anxiety}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, anxiety: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.anxiety}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>우울감 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.depression}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, depression: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.depression}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>스트레스 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.stress}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, stress: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.stress}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>수면 장애 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.sleepDisorder}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, sleepDisorder: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.sleepDisorder}</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* 3. 소화계 */}
          <div className="symptom-category-card" style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>
              3. 소화계
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <input
                  type="checkbox"
                  checked={commonSymptoms.appetiteLoss === 1}
                  onChange={(e) => setCommonSymptoms({ ...commonSymptoms, appetiteLoss: e.target.checked ? 1 : 0 })}
                  style={{ marginRight: '8px' }}
                />
                입맛저하
              </label>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>복통 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.abdominalPain}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, abdominalPain: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.abdominalPain}</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* 4. 근골격계 */}
          <div className="symptom-category-card" style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>
              4. 근골격계
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>관절통 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.jointPain}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, jointPain: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.jointPain}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>기능저하 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.functionalDecline}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, functionalDecline: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.functionalDecline}</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* 5. 피부 */}
          <div className="symptom-category-card" style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#1f2937' }}>
              5. 피부
            </h4>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>피부통증 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.skinPain}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, skinPain: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.skinPain}</span>
                <span>10</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>가려움증 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={commonSymptoms.itching}
                onChange={(e) => setCommonSymptoms({ ...commonSymptoms, itching: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                <span>0</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{commonSymptoms.itching}</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>

        {/* 질환별 전조 증상 */}
        {renderDiseaseSpecificSymptoms()}

        {/* 저장 버튼 */}
        <button
          className="add-symptom-btn"
          onClick={saveRecord}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '14px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}
        >
          기록 저장
        </button>
      </div>
    </div>
  );
};

export default FlareDiary;
