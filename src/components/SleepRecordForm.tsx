import React, { useState, useEffect } from 'react';
import { SleepRecord } from '../types';

interface Props {
  onAdd: (record: SleepRecord) => void;
  onDelete: (id: string) => void;
  existingRecords: SleepRecord[];
}

const SleepRecordForm: React.FC<Props> = ({ onAdd, onDelete, existingRecords }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [totalHours, setTotalHours] = useState(9);
  const [quality, setQuality] = useState(7);

  // 수면 시간 자동 계산
  useEffect(() => {
    const calculateHours = () => {
      const [sleepH, sleepM] = sleepTime.split(':').map(Number);
      const [wakeH, wakeM] = wakeTime.split(':').map(Number);
      
      let sleepMinutes = sleepH * 60 + sleepM;
      let wakeMinutes = wakeH * 60 + wakeM;
      
      // 다음날 기상인 경우
      if (wakeMinutes < sleepMinutes) {
        wakeMinutes += 24 * 60;
      }
      
      const totalMinutes = wakeMinutes - sleepMinutes;
      const hours = totalMinutes / 60;
      setTotalHours(Math.round(hours * 10) / 10);
    };

    calculateHours();
  }, [sleepTime, wakeTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: SleepRecord = {
      id: Date.now().toString(),
      date,
      sleepTime,
      wakeTime,
      totalHours,
      quality
    };
    onAdd(record);
    // 폼 초기화
    setDate(new Date().toISOString().split('T')[0]);
    setSleepTime('22:00');
    setWakeTime('07:00');
    setQuality(7);
  };

  return (
    <div className="record-form">
      <h3>수면 기록</h3>
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
          <label>취침 시간</label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>기상 시간</label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>총 수면 시간 (시간)</label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.1"
            value={totalHours}
            onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
            required
          />
          <span className="info-text">자동 계산되지만 수동으로 수정 가능합니다.</span>
        </div>

        <div className="form-group">
          <label>수면 질 (0-10)</label>
          <input
            type="range"
            min="0"
            max="10"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
          />
          <span className="score">{quality}</span>
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
                  <span className="record-sleep">
                    {record.sleepTime} ~ {record.wakeTime} ({record.totalHours}시간)
                  </span>
                  <span className="record-quality">수면 질: {record.quality}/10</span>
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

export default SleepRecordForm;

