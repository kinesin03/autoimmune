import React, { useState, useEffect } from 'react';
import {
  FlareManagementData,
  FlareRecord,
  StressRecord,
  FoodRecord,
  SleepRecord
} from '../types';
import {
  analyzeStressCorrelation,
  analyzeFoodCorrelation,
  analyzeSleepCorrelation,
  analyzeFlareRisk
} from '../utils/flareAnalysis';
import FlareRecordForm from './FlareRecordForm';
import StressRecordForm from './StressRecordForm';
import FoodRecordForm from './FoodRecordForm';
import SleepRecordForm from './SleepRecordForm';
import FlareAnalysisResults from './FlareAnalysisResults';
import { trackActivity } from '../utils/gameSystem';
import './FlareManagement.css';

const FlareManagement: React.FC = () => {
  const [data, setData] = useState<FlareManagementData>({
    flares: [],
    stressRecords: [],
    foodRecords: [],
    sleepRecords: [],
    foodCorrelations: []
  });

  const [activeTab, setActiveTab] = useState<'record' | 'analysis'>('record');
  const [recordType, setRecordType] = useState<'flare' | 'stress' | 'food' | 'sleep'>('flare');

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('flareManagementData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, []);

  // 데이터 변경 시 분석 및 저장
  useEffect(() => {
    const stressCorrelation = analyzeStressCorrelation(data.flares, data.stressRecords);
    const foodCorrelations = analyzeFoodCorrelation(data.flares, data.foodRecords);
    const sleepCorrelation = analyzeSleepCorrelation(data.flares, data.sleepRecords);
    const riskAnalysis = analyzeFlareRisk({
      ...data,
      stressCorrelation,
      foodCorrelations,
      sleepCorrelation
    });

    const updatedData: FlareManagementData = {
      ...data,
      stressCorrelation,
      foodCorrelations,
      sleepCorrelation,
      riskAnalysis
    };

    setData(updatedData);
    localStorage.setItem('flareManagementData', JSON.stringify(updatedData));
  }, [data.flares.length, data.stressRecords.length, data.foodRecords.length, data.sleepRecords.length]);

  const handleAddFlare = (flare: FlareRecord) => {
    setData(prev => ({
      ...prev,
      flares: [...prev.flares, flare].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));
    trackActivity('management');
  };

  const handleAddStress = (stress: StressRecord) => {
    setData(prev => ({
      ...prev,
      stressRecords: [...prev.stressRecords, stress].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));
    trackActivity('management');
  };

  const handleAddFood = (food: FoodRecord) => {
    setData(prev => ({
      ...prev,
      foodRecords: [...prev.foodRecords, food].sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      })
    }));
    trackActivity('management');
  };

  const handleAddSleep = (sleep: SleepRecord) => {
    setData(prev => ({
      ...prev,
      sleepRecords: [...prev.sleepRecords, sleep].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));
    trackActivity('management');
  };

  const handleDeleteFlare = (id: string) => {
    setData(prev => ({
      ...prev,
      flares: prev.flares.filter(f => f.id !== id)
    }));
  };

  const handleDeleteStress = (id: string) => {
    setData(prev => ({
      ...prev,
      stressRecords: prev.stressRecords.filter(s => s.id !== id)
    }));
  };

  const handleDeleteFood = (id: string) => {
    setData(prev => ({
      ...prev,
      foodRecords: prev.foodRecords.filter(f => f.id !== id)
    }));
  };

  const handleDeleteSleep = (id: string) => {
    setData(prev => ({
      ...prev,
      sleepRecords: prev.sleepRecords.filter(s => s.id !== id)
    }));
  };

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="ai-prediction">
      {/* 헤더 */}
      <div className="prediction-header">
        <div className="header-content">
          <div className="header-text-wrapper">
            <h1 className="prediction-title">분석</h1>
            <p className="prediction-subtitle">Flare 유발 요인을 분석하고 예측합니다.</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 - 흰색 박스 */}
      <div className="prediction-content-wrapper">
        {/* 날짜 표시 */}
        <div className="date-display-box">
          <span className="date-label">오늘</span>
          <span className="date-value">{todayFormatted}</span>
        </div>

        {/* 탭 */}
        <div className="prediction-tabs">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              기록하기
            </button>
            <button
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              분석 결과
            </button>
          </div>
        </div>

        {activeTab === 'record' && (
          <div className="record-section">
            <div className="record-type-selector">
              <button
                className={`record-type-btn ${recordType === 'flare' ? 'active' : ''}`}
                onClick={() => setRecordType('flare')}
              >
                Flare 기록
              </button>
              <button
                className={`record-type-btn ${recordType === 'stress' ? 'active' : ''}`}
                onClick={() => setRecordType('stress')}
              >
                스트레스 기록
              </button>
              <button
                className={`record-type-btn ${recordType === 'food' ? 'active' : ''}`}
                onClick={() => setRecordType('food')}
              >
                음식 기록
              </button>
              <button
                className={`record-type-btn ${recordType === 'sleep' ? 'active' : ''}`}
                onClick={() => setRecordType('sleep')}
              >
                수면 기록
              </button>
            </div>

            <div className="record-forms">
              {recordType === 'flare' && (
                <FlareRecordForm
                  onAdd={handleAddFlare}
                  onDelete={handleDeleteFlare}
                  existingRecords={data.flares}
                />
              )}
              {recordType === 'stress' && (
                <StressRecordForm
                  onAdd={handleAddStress}
                  onDelete={handleDeleteStress}
                  existingRecords={data.stressRecords}
                />
              )}
              {recordType === 'food' && (
                <FoodRecordForm
                  onAdd={handleAddFood}
                  onDelete={handleDeleteFood}
                  existingRecords={data.foodRecords}
                />
              )}
              {recordType === 'sleep' && (
                <SleepRecordForm
                  onAdd={handleAddSleep}
                  onDelete={handleDeleteSleep}
                  existingRecords={data.sleepRecords}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <FlareAnalysisResults data={data} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FlareManagement;

