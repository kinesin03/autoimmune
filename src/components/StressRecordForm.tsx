import React, { useState } from 'react';
import { StressRecord } from '../types';

interface Props {
  onAdd: (record: StressRecord) => void;
  onDelete: (id: string) => void;
  existingRecords: StressRecord[];
}

const StressRecordForm: React.FC<Props> = ({ onAdd, onDelete, existingRecords }) => {
  const [level, setLevel] = useState(5);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: StressRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0], // 오늘 날짜로 자동 설정
      level,
      note: note.trim() || undefined
    };
    onAdd(record);
    // 폼 초기화
    setLevel(5);
    setNote('');
  };

  return (
    <div className="record-form">
      <h3>스트레스 기록</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>스트레스 수준 (0-10)</label>
          <input
            type="range"
            min="0"
            max="10"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
          />
          <span className="score">{level}</span>
        </div>

        <div className="form-group">
          <label>메모 (선택사항)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="스트레스 원인, 상황 등을 기록하세요"
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary">기록 추가</button>
      </form>

      <div className="existing-records" style={{ marginTop: '20px' }}>
        <h4>기존 기록</h4>
        {existingRecords.length === 0 ? (
          <p className="no-records">기록이 없습니다.</p>
        ) : (
          <div className="records-list" style={{ maxHeight: '300px', overflowY: 'auto', paddingBottom: '20px' }}>
            {existingRecords.map(record => (
              <div key={record.id} className="record-item">
                <div className="record-info">
                  <span className="record-level">스트레스: {record.level}/10</span>
                  {record.note && (
                    <div className="record-note">{record.note}</div>
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

export default StressRecordForm;

