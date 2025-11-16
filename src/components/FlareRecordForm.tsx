import React, { useState } from 'react';
import { FlareRecord } from '../types';

interface Props {
  onAdd: (record: FlareRecord) => void;
  onDelete: (id: string) => void;
  existingRecords: FlareRecord[];
}

const FlareRecordForm: React.FC<Props> = ({ onAdd, onDelete, existingRecords }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState(1);
  const [newSymptom, setNewSymptom] = useState('');

  const symptomOptions = [
    '관절통', '피로감', '발진', '열', '두통', '소화불량',
    '호흡곤란', '가려움', '붓기', '근육통', '인지장애'
  ];

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: FlareRecord = {
      id: Date.now().toString(),
      date,
      severity,
      symptoms: [...symptoms],
      duration
    };
    onAdd(record);
    // 폼 초기화
    setDate(new Date().toISOString().split('T')[0]);
    setSeverity(5);
    setSymptoms([]);
    setDuration(1);
  };

  return (
    <div className="record-form">
      <h3>Flare 기록</h3>
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
          <label>심각도 (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
          />
          <span className="score">{severity}</span>
        </div>

        <div className="form-group">
          <label>증상</label>
          <div className="symptom-selector">
            {symptomOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={symptoms.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSymptoms([...symptoms, option]);
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
          {symptoms.length > 0 && (
            <div className="selected-symptoms">
              {symptoms.map(symptom => (
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
          <label>지속 시간 (일)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            required
          />
        </div>

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
                  <span className="record-date">{record.date}</span>
                  <span className="record-severity">심각도: {record.severity}/10</span>
                  <span className="record-duration">{record.duration}일</span>
                  <div className="record-symptoms">
                    {record.symptoms.join(', ')}
                  </div>
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

export default FlareRecordForm;

