import React, { useState, useEffect } from 'react';
import {
  FlareDiaryEntry,
  FlareTrigger,
  HospitalReport,
  FlareRecord,
  StressRecord,
  FoodRecord,
  SleepRecord,
  EnvironmentalData
} from '../types';
import { updateFlareTriggers, generateHospitalReport } from '../utils/flareDiaryAnalysis';
import './FlareDiary.css';

const FlareDiary: React.FC = () => {
  const [diaryEntries, setDiaryEntries] = useState<FlareDiaryEntry[]>([]);
  const [triggers, setTriggers] = useState<FlareTrigger[]>([]);
  const [hospitalReport, setHospitalReport] = useState<HospitalReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('flareDiary');
    if (saved) {
      try {
        setDiaryEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load diary:', e);
      }
    }
  }, []);

  // Trigger 업데이트
  useEffect(() => {
    const loadData = () => {
      const flares: FlareRecord[] = diaryEntries.map(e => ({
        id: e.id,
        date: e.date,
        severity: e.severity,
        symptoms: e.symptoms,
        duration: e.duration
      }));

      const stressRecords: StressRecord[] = JSON.parse(
        localStorage.getItem('flareManagementData') || '{}'
      ).stressRecords || [];

      const foodRecords: FoodRecord[] = JSON.parse(
        localStorage.getItem('flareManagementData') || '{}'
      ).foodRecords || [];

      const sleepRecords: SleepRecord[] = JSON.parse(
        localStorage.getItem('flareManagementData') || '{}'
      ).sleepRecords || [];

      const environmentalData: EnvironmentalData[] = JSON.parse(
        localStorage.getItem('environmentalData') || '[]'
      );

      const updatedTriggers = updateFlareTriggers(
        diaryEntries,
        stressRecords,
        foodRecords,
        sleepRecords,
        environmentalData
      );
      setTriggers(updatedTriggers);

      const report = generateHospitalReport(diaryEntries);
      setHospitalReport(report);
    };

    if (diaryEntries.length > 0) {
      loadData();
    }
  }, [diaryEntries]);

  const handleAddEntry = () => {
    const newEntry: FlareDiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      severity: 5,
      duration: 1,
      symptoms: [],
      estimatedTriggers: []
    };
    const updated = [...diaryEntries, newEntry].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setDiaryEntries(updated);
    localStorage.setItem('flareDiary', JSON.stringify(updated));
  };

  return (
    <div className="flare-diary">
      <div className="diary-header">
        <h2>증상 일지 (Flare 다이어리)</h2>
        <div className="diary-actions">
          <button className="btn btn-primary" onClick={handleAddEntry}>
            새 기록 추가
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowReport(!showReport)}
          >
            {showReport ? '일지 보기' : '병원 리포트 보기'}
          </button>
        </div>
      </div>

      {showReport && hospitalReport ? (
        <div className="hospital-report">
          <h3>병원 리포트</h3>
          <div className="report-period">
            기간: {hospitalReport.period.start} ~ {hospitalReport.period.end}
          </div>
          <div className="report-summary">
            <p>{hospitalReport.summary}</p>
          </div>
          <div className="report-details">
            <div className="detail-item">
              <span>Flare 횟수:</span>
              <strong>{hospitalReport.flareCount}회</strong>
            </div>
            <div className="detail-item">
              <span>평균 심각도:</span>
              <strong>{hospitalReport.averageSeverity}/10</strong>
            </div>
            <div className="detail-item">
              <span>약물 순응도:</span>
              <strong>{hospitalReport.medicationAdherence}%</strong>
            </div>
          </div>
          {hospitalReport.topTriggers.length > 0 && (
            <div className="report-triggers">
              <h4>주요 유발 요인</h4>
              <ul>
                {hospitalReport.topTriggers.map(trigger => (
                  <li key={trigger.id}>
                    {trigger.name} (신뢰도: {trigger.confidence.toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          {triggers.length > 0 && (
            <div className="trigger-list">
              <h3>AI 기반 Trigger 목록</h3>
              <div className="triggers-grid">
                {triggers.map(trigger => (
                  <div key={trigger.id} className="trigger-card">
                    <div className="trigger-header">
                      <span className="trigger-name">{trigger.name}</span>
                      <span className={`trigger-category category-${trigger.category}`}>
                        {trigger.category}
                      </span>
                    </div>
                    <div className="trigger-stats">
                      <span>신뢰도: {trigger.confidence.toFixed(0)}%</span>
                      <span>빈도: {trigger.frequency}회</span>
                    </div>
                    <div className="trigger-recommendation">
                      {trigger.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="diary-entries">
            <h3>Flare 기록</h3>
            {diaryEntries.length === 0 ? (
              <p className="no-entries">기록이 없습니다. 새 기록을 추가해주세요.</p>
            ) : (
              <div className="entries-list">
                {diaryEntries.map(entry => (
                  <div key={entry.id} className="diary-entry">
                    <div className="entry-header">
                      <span className="entry-date">{entry.date}</span>
                      <span className="entry-severity">심각도: {entry.severity}/10</span>
                      <span className="entry-duration">{entry.duration}일</span>
                    </div>
                    {entry.symptoms.length > 0 && (
                      <div className="entry-symptoms">
                        증상: {entry.symptoms.join(', ')}
                      </div>
                    )}
                    {entry.estimatedTriggers.length > 0 && (
                      <div className="entry-triggers">
                        유발 요인: {entry.estimatedTriggers.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FlareDiary;

