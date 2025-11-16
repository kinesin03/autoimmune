import React, { useState } from 'react';
import { FoodRecord } from '../types';

interface Props {
  onAdd: (record: FoodRecord) => void;
  onDelete: (id: string) => void;
  existingRecords: FoodRecord[];
}

const FoodRecordForm: React.FC<Props> = ({ onAdd, onDelete, existingRecords }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [foods, setFoods] = useState<string[]>([]);
  const [newFood, setNewFood] = useState('');
  const [hasSymptoms, setHasSymptoms] = useState(false);
  const [symptomHours, setSymptomHours] = useState(24);
  const [symptomList, setSymptomList] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [newSymptom, setNewSymptom] = useState('');

  const commonFoods = [
    '유제품', '밀가루', '설탕', '튀김', '가공식품',
    '연어', '블루베리', '브로콜리', '시금치', '올리브오일',
    '토마토', '감자', '땅콩', '옥수수', '알코올'
  ];

  const symptomOptions = [
    '피로감', '소화불량', '복통', '두통', '발진',
    '가려움', '붓기', '관절통', '메스꺼움'
  ];

  const handleAddFood = () => {
    if (newFood.trim() && !foods.includes(newFood.trim())) {
      setFoods([...foods, newFood.trim()]);
      setNewFood('');
    }
  };

  const handleRemoveFood = (food: string) => {
    setFoods(foods.filter(f => f !== food));
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptomList.includes(newSymptom.trim())) {
      setSymptomList([...symptomList, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSymptomList(symptomList.filter(s => s !== symptom));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foods.length === 0) {
      alert('최소 하나의 음식을 입력해주세요.');
      return;
    }

    const record: FoodRecord = {
      id: Date.now().toString(),
      date,
      time,
      foods: [...foods],
      symptomsAfter: hasSymptoms && symptomList.length > 0 ? {
        hours: symptomHours,
        symptoms: [...symptomList],
        severity: symptomSeverity
      } : undefined
    };
    onAdd(record);
    // 폼 초기화
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setFoods([]);
    setNewFood('');
    setHasSymptoms(false);
    setSymptomHours(24);
    setSymptomList([]);
    setSymptomSeverity(5);
  };

  return (
    <div className="record-form">
      <h3>음식 기록</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>시간</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>섭취한 음식</label>
          <div className="food-selector">
            {commonFoods.map(food => (
              <label key={food} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={foods.includes(food)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFoods([...foods, food]);
                    } else {
                      handleRemoveFood(food);
                    }
                  }}
                />
                {food}
              </label>
            ))}
          </div>
          <div className="custom-food">
            <input
              type="text"
              placeholder="기타 음식 입력"
              value={newFood}
              onChange={(e) => setNewFood(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFood();
                }
              }}
            />
            <button type="button" onClick={handleAddFood}>추가</button>
          </div>
          {foods.length > 0 && (
            <div className="selected-items">
              {foods.map(food => (
                <span key={food} className="item-tag">
                  {food}
                  <button
                    type="button"
                    onClick={() => handleRemoveFood(food)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasSymptoms}
              onChange={(e) => setHasSymptoms(e.target.checked)}
            />
            섭취 후 증상이 있었나요?
          </label>
        </div>

        {hasSymptoms && (
          <>
            <div className="form-group">
              <label>증상 발생까지 시간 (시간)</label>
              <input
                type="number"
                min="0"
                max="72"
                value={symptomHours}
                onChange={(e) => setSymptomHours(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label>증상</label>
              <div className="symptom-selector">
                {symptomOptions.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={symptomList.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSymptomList([...symptomList, option]);
                        } else {
                          handleRemoveSymptom(option);
                        }
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
              <div className="custom-symptom">
                <input
                  type="text"
                  placeholder="기타 증상 입력"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSymptom();
                    }
                  }}
                />
                <button type="button" onClick={handleAddSymptom}>추가</button>
              </div>
              {symptomList.length > 0 && (
                <div className="selected-symptoms">
                  {symptomList.map(symptom => (
                    <span key={symptom} className="symptom-tag">
                      {symptom}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(symptom)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>증상 심각도 (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={symptomSeverity}
                onChange={(e) => setSymptomSeverity(parseInt(e.target.value))}
              />
              <span className="score">{symptomSeverity}</span>
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary">기록 추가</button>
      </form>

      <div className="existing-records">
        <h4>기존 기록</h4>
        {existingRecords.length === 0 ? (
          <p className="no-records">기록이 없습니다.</p>
        ) : (
          <div className="records-list">
            {existingRecords.map(record => (
              <div key={record.id} className="record-item">
                <div className="record-info">
                  <span className="record-date">{record.date} {record.time}</span>
                  <div className="record-foods">
                    {record.foods.join(', ')}
                  </div>
                  {record.symptomsAfter && (
                    <div className="record-symptoms">
                      {record.symptomsAfter.hours}시간 후: {record.symptomsAfter.symptoms.join(', ')} 
                      (심각도: {record.symptomsAfter.severity}/10)
                    </div>
                  )}
                </div>
                <button
                  className="btn-delete"
                  onClick={() => onDelete(record.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodRecordForm;

