import React, { useState, useEffect, useRef } from 'react';
import { Moon, Utensils, Droplet, Pill, Dumbbell, Calendar, Plus, Edit2, Camera, X } from 'lucide-react';
import { trackActivity } from '../utils/gameSystem';
import './FlareDiary.css';

// 타입 정의
interface DailyRecord {
  id: string;
  date: string;
  sleep?: {
    hours: number;
    minutes: number;
    quality: 'good' | 'fair' | 'poor';
  };
  meals?: {
    breakfast?: { name: string; menu: string; image?: string };
    lunch?: { name: string; menu: string; image?: string };
    dinner?: { name: string; menu: string; image?: string };
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

const FlareDiary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'symptom'>('daily');
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
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
  const handleSleepUpdate = (ampm: '오전' | '오후', hour: number, minute: number, quality: 'good' | 'fair' | 'poor') => {
    if (!todayRecord) return;
    // 24시간 형식으로 변환
    let hours24 = hour;
    if (ampm === '오후' && hour !== 12) {
      hours24 = hour + 12;
    } else if (ampm === '오전' && hour === 12) {
      hours24 = 0;
    }
    const updated = {
      ...todayRecord,
      sleep: { hours: hours24, minutes: minute, quality }
    };
    saveDailyRecord(updated);
  };

  // 식사 기록
  const handleMealUpdate = (mealType: 'breakfast' | 'lunch' | 'dinner', name: string, menu: string, image?: string) => {
    if (!todayRecord) return;
    const updated = {
      ...todayRecord,
      meals: {
        ...todayRecord.meals,
        [mealType]: { name, menu, image }
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

  // 수면 품질 텍스트
  const getSleepQualityText = (quality?: 'good' | 'fair' | 'poor') => {
    if (!quality) return '기록 없음';
    return quality === 'good' ? '좋음' : quality === 'fair' ? '보통' : '나쁨';
  };

  // 수면 품질 색상
  const getSleepQualityColor = (quality?: 'good' | 'fair' | 'poor') => {
    if (!quality) return '#e5e7eb';
    return quality === 'good' ? '#d1fae5' : quality === 'fair' ? '#fef3c7' : '#fee2e2';
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
                    {(() => {
                      const h = todayRecord.sleep.hours;
                      const ampm = h >= 12 ? '오후' : '오전';
                      const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                      return `${ampm} ${hour12}시 ${todayRecord.sleep.minutes}분`;
                    })()}
                  </p>
                ) : (
                  <p className="card-text">기록 없음</p>
                )}
              </div>
              <span 
                className="status-tag"
                style={{ background: getSleepQualityColor(todayRecord?.sleep?.quality) }}
              >
                {getSleepQualityText(todayRecord?.sleep?.quality)}
              </span>
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
                {mealCount < 3 ? '저녁 추가' : '기록 수정'}
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
          <div className="symptom-diary">
            <div className="symptom-section">
            <h2 className="section-title">오늘의 증상</h2>
            <p className="section-subtitle">류마티스 관절염 증상을 기록해주세요</p>
            
            <div className="symptom-list">
              {symptomEntries
                .find(e => e.date === today)
                ?.symptoms.map((symptom, idx) => (
                  <div key={idx} className="symptom-item">
                    <span className="symptom-name">{symptom.name}</span>
                    <span 
                      className="severity-badge"
                      style={{ background: getSeverityColor(symptom.severity) }}
                    >
                      {getSeverityText(symptom.severity)}
                    </span>
                  </div>
                ))}
            </div>

            <button 
              className="add-symptom-btn"
              onClick={() => setShowModal('symptom')}
            >
              증상 추가하기
            </button>
          </div>

          <div className="trend-section">
            <h2 className="section-title">최근 7일 추이</h2>
            <div className="week-days">
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
              <span>일</span>
            </div>
            {/* 차트 영역 - 추후 구현 */}
          </div>
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showModal === 'sleep' && (
        <SleepModal
          sleep={todayRecord?.sleep}
          onSave={(ampm, hour, minute, quality) => {
            handleSleepUpdate(ampm, hour, minute, quality);
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
          onSave={(mealType, name, menu, image) => {
            handleMealUpdate(mealType, name, menu, image);
            setShowModal(null);
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
    </div>
  );
};

// 모달 컴포넌트들
const SleepModal: React.FC<{
  sleep?: { hours: number; minutes: number; quality: 'good' | 'fair' | 'poor' };
  onSave: (ampm: '오전' | '오후', hour: number, minute: number, quality: 'good' | 'fair' | 'poor') => void;
  onClose: () => void;
}> = ({ sleep, onSave, onClose }) => {
  // 24시간 형식을 12시간 형식으로 변환
  const hours24 = sleep?.hours || 7;
  const initialAmpm: '오전' | '오후' = hours24 >= 12 ? '오후' : '오전';
  const initialHour = hours24 > 12 ? hours24 - 12 : (hours24 === 0 ? 12 : hours24);
  
  const [ampm, setAmpm] = useState<'오전' | '오후'>(initialAmpm);
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(sleep?.minutes || 0);
  const [quality, setQuality] = useState<'good' | 'fair' | 'poor'>(sleep?.quality || 'good');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>수면 기록</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>수면 시간</label>
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
            <label>수면 질</label>
            <div className="quality-buttons">
              <button
                className={`quality-btn ${quality === 'good' ? 'active' : ''}`}
                onClick={() => setQuality('good')}
              >
                좋음
              </button>
              <button
                className={`quality-btn ${quality === 'fair' ? 'active' : ''}`}
                onClick={() => setQuality('fair')}
              >
                보통
              </button>
              <button
                className={`quality-btn ${quality === 'poor' ? 'active' : ''}`}
                onClick={() => setQuality('poor')}
              >
                나쁨
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => onSave(ampm, hour, minute, quality)}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const MealModal: React.FC<{
  meals?: { breakfast?: { name: string; menu: string; image?: string }; lunch?: { name: string; menu: string; image?: string }; dinner?: { name: string; menu: string; image?: string } };
  onSave: (mealType: 'breakfast' | 'lunch' | 'dinner', name: string, menu: string, image?: string) => void;
  onClose: () => void;
}> = ({ meals, onSave, onClose }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [menu, setMenu] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 선택된 식사 타입에 따라 기존 데이터 로드
  useEffect(() => {
    const currentMeal = meals?.[mealType];
    if (currentMeal) {
      setMenu(currentMeal.menu || '');
      setImagePreview(currentMeal.image || null);
    } else {
      setMenu('');
      setImagePreview(null);
    }
  }, [mealType, meals]);

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
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => {
            if (menu) {
              onSave(mealType, `${mealType === 'breakfast' ? '아침' : mealType === 'lunch' ? '점심' : '저녁'}식사`, menu, imagePreview || undefined);
            }
          }}>
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
  meals?: { breakfast?: { name: string; menu: string; image?: string }; lunch?: { name: string; menu: string; image?: string }; dinner?: { name: string; menu: string; image?: string } };
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

export default FlareDiary;
