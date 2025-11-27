import React, { useState, useEffect } from 'react';
import {
  FlareManagementData
} from '../types';
import {
  analyzeStressCorrelation,
  analyzeFoodCorrelation,
  analyzeSleepCorrelation,
  analyzeFlareRisk
} from '../utils/flareAnalysis';
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
  const [refreshKey, setRefreshKey] = useState(0);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('flareManagementData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setData(parsed);
        } catch (e) {
          console.error('Failed to load saved data:', e);
        }
      }
    };
    
    loadData();
    
    // 컴포넌트가 포커스를 받을 때마다 데이터 다시 로드
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 증상일지 데이터 변경 감지 및 강제 리프레시
  useEffect(() => {
    const checkForUpdates = () => {
      // 스트레스 기록도 함께 확인
      const saved = localStorage.getItem('flareManagementData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.stressRecords) {
            setData(prev => ({ ...prev, stressRecords: parsed.stressRecords }));
          }
        } catch (e) {
          console.error('Failed to load stress records:', e);
        }
      }
      
      const records = localStorage.getItem('prodromalSymptomRecords');
      const diseases = localStorage.getItem('userDiseases');
      if (records || diseases) {
        console.log('Detected data change, refreshing analysis');
        setRefreshKey(prev => prev + 1);
      }
    };

    // 초기 체크
    checkForUpdates();

    // 커스텀 이벤트 리스너
    const handleUpdate = () => {
      console.log('Custom event received, refreshing');
      setTimeout(checkForUpdates, 100);
    };
    
    // 스트레스 기록 업데이트 이벤트 리스너
    const handleStressUpdate = () => {
      console.log('Stress records updated, refreshing');
      setTimeout(checkForUpdates, 100);
    };

    // storage 이벤트 리스너 (다른 탭)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flareManagementData' || e.key === 'prodromalSymptomRecords' || e.key === 'userDiseases') {
        console.log('Storage event received, refreshing');
        setTimeout(checkForUpdates, 100);
      }
    };

    window.addEventListener('prodromalSymptomRecordsUpdated', handleUpdate);
    window.addEventListener('stressRecordsUpdated', handleStressUpdate);
    window.addEventListener('storage', handleStorageChange);

    // 주기적으로 체크 (매 2초)
    const interval = setInterval(checkForUpdates, 2000);

    return () => {
      window.removeEventListener('prodromalSymptomRecordsUpdated', handleUpdate);
      window.removeEventListener('stressRecordsUpdated', handleStressUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 데이터 변경 시 분석 및 저장
  useEffect(() => {
    // 스트레스 기록은 localStorage에서 다시 로드 (일지 칸에서 업데이트될 수 있음)
    const saved = localStorage.getItem('flareManagementData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stressRecords) {
          setData(prev => ({ ...prev, stressRecords: parsed.stressRecords }));
        }
      } catch (e) {
        console.error('Failed to load stress records:', e);
      }
    }

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
            <h1 className="prediction-title">AI분석</h1>
            <p className="prediction-subtitle">Flare 유발 요인을 분석하고 예측합니다.</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 - 흰색 박스 */}
      <div className="prediction-content-wrapper">
        {/* 분석 결과 - 상단 배치 */}
        <div className="analysis-section">
          <FlareAnalysisResults key={refreshKey} data={data} />
        </div>
      </div>
    </div>
  );
};

export default FlareManagement;

