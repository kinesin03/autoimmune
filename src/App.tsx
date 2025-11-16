import { useState } from 'react';
import CommonSymptomsForm from './components/CommonSymptomsForm';
import DiseaseSpecificForms from './components/DiseaseSpecificForms';
import Results from './components/Results';
import FlareManagement from './components/FlareManagement';
import FlareDiary from './components/FlareDiary';
import EnvironmentalRisk from './components/EnvironmentalRisk';
import EmotionalCare from './components/EmotionalCare';
import TodayFlareIndex from './components/TodayFlareIndex';
import { DiagnosisData, CommonSymptoms, DiseaseSpecificSymptoms } from './types';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'diagnosis' | 'flare' | 'diary' | 'environment' | 'emotional'>('today');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>({
    commonSymptoms: {
      fatigue: 0,
      anxietyDepressionConcentration: 0,
      appetiteDigestion: 0,
      jointPain: 0,
      skinAbnormalities: 0,
    },
    diseaseSpecific: {},
  });

  const [showResults, setShowResults] = useState(false);

  const handleCommonSymptomsChange = (symptoms: CommonSymptoms) => {
    setDiagnosisData({
      ...diagnosisData,
      commonSymptoms: symptoms,
    });
  };

  const handleDiseaseSpecificChange = (symptoms: DiseaseSpecificSymptoms) => {
    setDiagnosisData({
      ...diagnosisData,
      diseaseSpecific: symptoms,
    });
  };

  const handleSubmit = () => {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setDiagnosisData({
      commonSymptoms: {
        fatigue: 0,
        anxietyDepressionConcentration: 0,
        appetiteDigestion: 0,
        jointPain: 0,
        skinAbnormalities: 0,
      },
      diseaseSpecific: {},
    });
    setShowResults(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Flarecast : 개인 맞춤형 자가면역 관리</h1>
        <p className="subtitle">증상을 체크하고 점수를 확인하세요</p>
        <div className="main-tabs">
          <button
            className={`main-tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            오늘의 Flare 지수
          </button>
          <button
            className={`main-tab ${activeTab === 'environment' ? 'active' : ''}`}
            onClick={() => setActiveTab('environment')}
          >
            환경 위험도
          </button>
          <button
            className={`main-tab ${activeTab === 'diagnosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnosis')}
          >
            전조증상 자가진단
          </button>
          <button
            className={`main-tab ${activeTab === 'flare' ? 'active' : ''}`}
            onClick={() => setActiveTab('flare')}
          >
            Flare 유발 요인 관리
          </button>
          <button
            className={`main-tab ${activeTab === 'diary' ? 'active' : ''}`}
            onClick={() => setActiveTab('diary')}
          >
            증상 일지
          </button>
          <button
            className={`main-tab ${activeTab === 'emotional' ? 'active' : ''}`}
            onClick={() => setActiveTab('emotional')}
          >
            심리 케어
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'today' && (
          <TodayFlareIndex diagnosisData={diagnosisData} />
        )}

        {activeTab === 'environment' && (
          <EnvironmentalRisk />
        )}

        {activeTab === 'diagnosis' && (
          <>
            {showResults && (
              <Results data={diagnosisData} />
            )}

            <div className="form-container">
              <CommonSymptomsForm
                symptoms={diagnosisData.commonSymptoms}
                onChange={handleCommonSymptomsChange}
              />

              <DiseaseSpecificForms
                symptoms={diagnosisData.diseaseSpecific}
                onChange={handleDiseaseSpecificChange}
              />

              <div className="button-group">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  진단 결과 확인
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  초기화
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'flare' && (
          <FlareManagement />
        )}

        {activeTab === 'diary' && (
          <FlareDiary />
        )}

        {activeTab === 'emotional' && (
          <EmotionalCare />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Flarecast : 개인 맞춤형 자가면역 관리</p>
        <p className="disclaimer-text">
          본 시스템은 참고용이며, 정확한 진단을 위해서는 반드시 전문의와 상담하시기 바랍니다.
        </p>
      </footer>
    </div>
  );
}

export default App;

// App.tsx 파일 코드 상단에 추가 (예시)
import { useEffect } from 'react'; 
// ... 다른 import 문들

function App() {
  
  // ✅ 아래 useEffect 코드를 추가합니다.
  useEffect(() => {
    // 3055 포트로 WebSocket 연결 시도
    const socket = new WebSocket('ws://localhost:3055'); 
    
    // 연결 성공 시 (선택 사항)
    socket.onopen = () => {
      console.log('Figma App connected to server!');
    };
    
    // 컴포넌트 unmount 시 소켓 연결 닫기 (정리)
    return () => {
      socket.close();
    };
  }, []);

  // ... 나머지 App 컴포넌트 내용

