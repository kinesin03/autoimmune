import React, { useState, useEffect } from 'react';
import { Lupus, DailyUVIndex } from '../types';
import { getUVIndexStatusText, getUVIndexStatusColor, getDayName, defaultTimeSlots } from '../utils/uvIndexHelper';
import { fetchUVIndexData, predictLupusFlare, LupusFlarePrediction } from '../utils/lupusFlarePrediction';
import './LupusForm.css';

interface Props {
  symptoms?: Lupus;
  onUpdate: (lupus: Lupus) => void;
  uvIndex: number | null;
}

const LupusForm: React.FC<Props> = ({ symptoms, onUpdate, uvIndex }) => {
  const [facialRash, setFacialRash] = useState(symptoms?.facialRash || false);
  const [oralUlcers, setOralUlcers] = useState(symptoms?.oralUlcers || false);
  const [sunlightExposure, setSunlightExposure] = useState(symptoms?.sunlightExposure || 0);
  const [dailyUVIndex, setDailyUVIndex] = useState<DailyUVIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<LupusFlarePrediction | null>(null);

  // 자외선 지수 데이터 자동 로드
  useEffect(() => {
    const loadUVIndexData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // 기존 데이터가 있으면 사용, 없으면 새로 가져오기
        if (symptoms?.dailyUVIndex && symptoms.dailyUVIndex.length > 0) {
          setDailyUVIndex(symptoms.dailyUVIndex);
        } else {
          const [todayData, tomorrowData] = await Promise.all([
            fetchUVIndexData(todayStr),
            fetchUVIndexData(tomorrowStr)
          ]);
          
          const newData: DailyUVIndex[] = [
            {
              date: todayStr,
              dayName: getDayName(today),
              timeSlots: todayData
            },
            {
              date: tomorrowStr,
              dayName: getDayName(tomorrow),
              timeSlots: tomorrowData
            }
          ];
          
          setDailyUVIndex(newData);
        }
      } catch (error) {
        console.error('자외선 지수 데이터를 가져오는 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUVIndexData();
  }, []);

  // Flare 예측 업데이트
  useEffect(() => {
    if (dailyUVIndex.length > 0) {
      const flarePrediction = predictLupusFlare(dailyUVIndex, sunlightExposure);
      setPrediction(flarePrediction);
    }
  }, [dailyUVIndex, sunlightExposure]);

  // 루푸스 데이터 업데이트
  useEffect(() => {
    onUpdate({
      facialRash,
      oralUlcers,
      sunlightExposure,
      uvIndex: uvIndex || undefined,
      dailyUVIndex
    });
  }, [facialRash, oralUlcers, sunlightExposure, dailyUVIndex, uvIndex, onUpdate]);

  return (
    <div className="disease-form">
      <h3>루푸스</h3>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={facialRash}
            onChange={(e) => setFacialRash(e.target.checked)}
          />
          얼굴 발진
        </label>
      </div>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={oralUlcers}
            onChange={(e) => setOralUlcers(e.target.checked)}
          />
          입안 궤양
        </label>
      </div>
      
      <div className="form-group">
        <label>햇빛 노출 시간 (시간):</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={sunlightExposure}
          onChange={(e) => setSunlightExposure(parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Flare 예측 결과 */}
      {prediction && (
        <div className={`flare-prediction prediction-${prediction.riskLevel}`}>
          <h4>Flare 발생 예측</h4>
          <div className="prediction-header">
            <div className="prediction-score">
              <span>위험 점수: {prediction.riskScore}/100</span>
              <span className={`risk-level-badge risk-${prediction.riskLevel}`}>
                {prediction.riskLevel === 'critical' ? '매우 높음' :
                 prediction.riskLevel === 'veryHigh' ? '높음' :
                 prediction.riskLevel === 'high' ? '보통 높음' :
                 prediction.riskLevel === 'medium' ? '보통' : '낮음'}
              </span>
            </div>
            <div className="prediction-probability">
              예상 확률: <strong>{prediction.probability}%</strong>
            </div>
          </div>
          <div className="prediction-message">
            {prediction.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {prediction.riskFactors.length > 0 && (
            <div className="prediction-factors">
              <h5>위험 요인:</h5>
              <ul>
                {prediction.riskFactors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="prediction-recommendations">
            <h5>권장 사항:</h5>
            <ul>
              {prediction.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 이틀치 시간대별 자외선 지수 */}
      {loading ? (
        <div className="uv-index-loading">
          <p>자외선 지수 데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="uv-index-schedule">
          <h4>이틀치 자외선 지수 (시간대별)</h4>
          <div className="uv-index-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: getUVIndexStatusColor('low') }}></span>
              <span>낮음 (3 미만)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: getUVIndexStatusColor('normal') }}></span>
              <span>보통 (3 이상 6 미만)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: getUVIndexStatusColor('high') }}></span>
              <span>높음 (6 이상 8 미만)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: getUVIndexStatusColor('veryHigh') }}></span>
              <span>매우높음 (8 이상 11 미만)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: getUVIndexStatusColor('danger') }}></span>
              <span>위험 (11 이상)</span>
            </div>
          </div>

          <div className="uv-index-days">
            {dailyUVIndex.map((day, dayIndex) => (
              <div key={day.date} className="uv-index-day">
                <div className="day-header">
                  <span className="day-date">{day.date.split('-')[2]}일({day.dayName})</span>
                </div>
                <div className="time-slots">
                  {day.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="time-slot">
                      <div className="time-range">{slot.timeRange}</div>
                      <div className="uv-index-value-display">{slot.uvIndex}</div>
                      <div
                        className="uv-status-badge"
                        style={{ backgroundColor: getUVIndexStatusColor(slot.status) }}
                      >
                        {getUVIndexStatusText(slot.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uvIndex !== null && (
        <div className="form-group">
          <label>현재 자외선 수치 (UV Index):</label>
          <span className="uv-index">{uvIndex}</span>
        </div>
      )}
    </div>
  );
};

export default LupusForm;

