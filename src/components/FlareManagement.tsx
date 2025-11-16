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
  };

  const handleAddStress = (stress: StressRecord) => {
    setData(prev => ({
      ...prev,
      stressRecords: [...prev.stressRecords, stress].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));
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
  };

  const handleAddSleep = (sleep: SleepRecord) => {
    setData(prev => ({
      ...prev,
      sleepRecords: [...prev.sleepRecords, sleep].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));
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

  return (
    <div className="flare-management">
      <div className="flare-header">
        <h2>Flare 유발 요인 추정 및 관리</h2>
        <div className="tab-buttons">
          <button
            className={activeTab === 'record' ? 'active' : ''}
            onClick={() => setActiveTab('record')}
          >
            기록하기
          </button>
          <button
            className={activeTab === 'analysis' ? 'active' : ''}
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
              className={recordType === 'flare' ? 'active' : ''}
              onClick={() => setRecordType('flare')}
            >
              Flare 기록
            </button>
            <button
              className={recordType === 'stress' ? 'active' : ''}
              onClick={() => setRecordType('stress')}
            >
              스트레스 기록
            </button>
            <button
              className={recordType === 'food' ? 'active' : ''}
              onClick={() => setRecordType('food')}
            >
              음식 기록
            </button>
            <button
              className={recordType === 'sleep' ? 'active' : ''}
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
        <FlareAnalysisResults data={data} />
      )}
    </div>
  );
};

export default FlareManagement;

