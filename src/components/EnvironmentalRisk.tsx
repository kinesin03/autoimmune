import React, { useState, useEffect } from 'react';
import { EnvironmentalData, EnvironmentalRiskAnalysis } from '../types';
import { analyzeEnvironmentalRisk } from '../utils/environmentalRiskAnalysis';
import { fetchEnvironmentalData } from '../utils/weather/environmentalDataFetcher';
import './EnvironmentalRisk.css';

const EnvironmentalRisk: React.FC = () => {
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<EnvironmentalRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [hasRealTimeFlag, setHasRealTimeFlag] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const data: EnvironmentalData[] = [];
      
      // 최근 3일 데이터 가져오기
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const envData = await fetchEnvironmentalData(dateStr);
        data.push(envData);
      }
      
      // 실시간 데이터인지 확인
      const firstData = data[0];
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || import.meta.env.VITE_KMA_API_KEY;
      
      // API 호출 성공 여부 확인 (_isRealTime 플래그 우선 확인)
      const todayStr = today.toISOString().split('T')[0];
      const todayData = data.find(d => d.date === todayStr);
      const realTimeFlag = todayData && (todayData as any)._isRealTime === true;
      
      // 실시간 데이터 판단: _isRealTime 플래그가 있으면 무조건 실시간 데이터
      // 플래그가 없으면 예시 데이터로 간주
      const isRealData = realTimeFlag === true; // 플래그가 true일 때만 실시간 데이터로 간주
      
      console.log('📊 데이터 출처 확인:', {
        hasApiKey: !!apiKey,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : '없음',
        today: todayStr,
        todayData: todayData,
        hasRealTimeFlag: realTimeFlag,
        firstDataTemp: firstData.temperature,
        firstDataHumidity: firstData.humidity,
        isRealData,
        allDataDates: data.map(d => d.date),
        todayDataWithFlag: todayData ? (todayData as any)._isRealTime : undefined
      });
      
      setIsRealTime(isRealData);
      setHasRealTimeFlag(realTimeFlag ?? false);
      setEnvironmentalData(data);
      const analysis = analyzeEnvironmentalRisk(data);
      setRiskAnalysis(analysis);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('환경 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    loadData();
    
    // 10분마다 자동 갱신
    const interval = setInterval(() => {
      loadData();
    }, 10 * 60 * 1000); // 10분
    
    return () => clearInterval(interval);
  }, []);

  // 디버깅: 실시간 데이터 플래그와 환경 데이터 추적
  useEffect(() => {
    console.log("🔍 렌더링/데이터 업데이트:");
    console.log("  - hasRealTimeFlag:", hasRealTimeFlag);
    console.log("  - isRealTime:", isRealTime);
    console.log("  - environmentalData:", environmentalData);
    console.log("  - 첫 번째 데이터:", environmentalData[0]);
    if (environmentalData[0]) {
      console.log("  - 첫 번째 데이터 _isRealTime 플래그:", (environmentalData[0] as any)._isRealTime);
    }
  }, [hasRealTimeFlag, isRealTime, environmentalData]);

  if (loading) {
    return <div className="environmental-loading">환경 데이터를 불러오는 중...</div>;
  }

  if (!riskAnalysis) {
    return null;
  }

  return (
    <div className={`environmental-risk risk-${riskAnalysis.riskLevel}`}>
      <h3>환경 정보 기반 Flare 위험도</h3>
      <div className="data-source-notice">
        {isRealTime ? (
          <div>
            <p>✅ <strong>실시간 기상 데이터를 사용 중입니다.</strong> 대전광역시 유성구 실시간 기상 정보</p>
            {lastUpdate && (
              <p className="update-time">
                마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')} (10분마다 자동 갱신)
              </p>
            )}
            <button 
              className="btn-refresh" 
              onClick={loadData}
              disabled={loading}
            >
              {loading ? '갱신 중...' : '🔄 지금 갱신'}
            </button>
          </div>
        ) : (
          <>
            <p>⚠️ <strong>현재 예시 데이터를 사용 중입니다.</strong> 표시된 기온은 실제 기상 데이터가 아닙니다.</p>
            <p className="data-source-warning" style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '10px' }}>
              🔍 디버깅: 브라우저 콘솔(F12)을 열어서 다음을 확인하세요:
              <br />- "🔍 API 키 확인 (상세)" 로그에서 keyValue가 표시되는지
              <br />- "🌐 OpenWeatherMap API 호출 시도..." 메시지가 나오는지
              <br />- "❌ OpenWeatherMap API 호출 실패" 에러가 있는지
            </p>
            <p className="data-source-info">
              <strong>실시간 기상 데이터를 사용하려면 (무료):</strong>
              <br />
              1. <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer">OpenWeatherMap</a>에서 무료 API 키 발급 (1분 소요)
              <br />
              2. .env 파일에 <code>VITE_WEATHER_API_KEY=your_api_key</code> 추가
              <br />
              3. <strong style={{ color: '#d32f2f' }}>개발 서버를 완전히 종료하고 재시작</strong> (중요!)
              <br />
              4. 브라우저를 완전히 새로고침 (Ctrl+Shift+R 또는 Ctrl+F5)
              <br />
              <br />
              또는 기상청 API 사용:
              <br />
              - <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer">공공데이터포털</a>에서 기상청 API 신청
              <br />
              - .env 파일에 <code>VITE_KMA_API_KEY=your_api_key</code> 추가
            </p>
            <p className="data-source-warning">
              ⚠️ 예시 데이터는 실제 날씨와 다를 수 있습니다. 정확한 Flare 위험도 분석을 위해 실제 API 키 설정을 권장합니다.
            </p>
            {lastUpdate && (
              <p className="update-time">
                마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')} (10분마다 자동 갱신)
              </p>
            )}
            <button 
              className="btn-refresh" 
              onClick={loadData}
              disabled={loading}
            >
              {loading ? '갱신 중...' : '🔄 지금 갱신'}
            </button>
          </>
        )}
      </div>
      
      <div className="risk-score">
        <span>위험 점수: {riskAnalysis.riskScore}/100</span>
        <span className={`risk-level-badge risk-${riskAnalysis.riskLevel}`}>
          {riskAnalysis.riskLevel === 'critical' ? '매우 높음' :
           riskAnalysis.riskLevel === 'high' ? '높음' :
           riskAnalysis.riskLevel === 'medium' ? '보통' : '낮음'}
        </span>
      </div>

      <div className="environmental-data">
        <h4>최근 환경 정보</h4>
        <div className="data-grid">
          {environmentalData.map((data, i) => (
            <div key={i} className="data-item">
              <div className="data-date">{data.date}</div>
              <div className="data-values">
                <div>기온: {data.temperature}°C</div>
                <div>습도: {data.humidity}%</div>
                <div>기압: {data.pressure}hPa</div>
                <div>생활기상지수: {data.weatherIndex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="risk-message">
        {riskAnalysis.message.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <div className="risk-factors">
        <h4>위험 요인:</h4>
        <ul>
          {riskAnalysis.factors.temperature && <li>기온</li>}
          {riskAnalysis.factors.humidity && <li>습도</li>}
          {riskAnalysis.factors.pressure && <li>기압 변화</li>}
          {riskAnalysis.factors.weatherIndex && <li>생활기상지수</li>}
          {!riskAnalysis.factors.temperature && 
           !riskAnalysis.factors.humidity && 
           !riskAnalysis.factors.pressure && 
           !riskAnalysis.factors.weatherIndex && 
           <li>현재 위험 요인 없음</li>}
        </ul>
      </div>

      <div className="recommendations">
        <h4>권장 사항:</h4>
        <ul>
          {riskAnalysis.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnvironmentalRisk;

