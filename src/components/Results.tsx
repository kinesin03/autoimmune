import React from 'react';
import { DiagnosisData } from '../types';
import { getUVIndexStatusText, getUVIndexStatusColor } from '../utils/uvIndexHelper';
import ProdromalFlarePrediction from './ProdromalFlarePrediction';

interface Props {
  data: DiagnosisData;
}

const Results: React.FC<Props> = ({ data }) => {
  // 공통 증상 총점 계산
  const commonTotalScore = 
    data.commonSymptoms.fatigue +
    data.commonSymptoms.anxietyDepressionConcentration +
    data.commonSymptoms.appetiteDigestion +
    data.commonSymptoms.jointPain +
    data.commonSymptoms.skinAbnormalities;

  const maxCommonScore = 25; // 5개 항목 × 5점

  return (
    <div className="results-section">
      <h2>진단 결과</h2>
      
      <ProdromalFlarePrediction diagnosisData={data} />
      
      <div className="result-card">
        <h3>공통 전조증상 점수</h3>
        <div className="score-breakdown">
          <div className="score-item">
            <span>피로감:</span>
            <span className="score-value">{data.commonSymptoms.fatigue}점</span>
          </div>
          <div className="score-item">
            <span>불안감, 우울감, 집중력:</span>
            <span className="score-value">{data.commonSymptoms.anxietyDepressionConcentration}점</span>
          </div>
          <div className="score-item">
            <span>입맛 저하, 소화불량:</span>
            <span className="score-value">{data.commonSymptoms.appetiteDigestion}점</span>
          </div>
          <div className="score-item">
            <span>관절통:</span>
            <span className="score-value">{data.commonSymptoms.jointPain}점</span>
          </div>
          <div className="score-item">
            <span>피부 이상:</span>
            <span className="score-value">{data.commonSymptoms.skinAbnormalities}점</span>
          </div>
        </div>
        <div className="total-score">
          <span>총점:</span>
          <span className="score-value-large">{commonTotalScore} / {maxCommonScore}점</span>
        </div>
        <div className="score-percentage">
          <div 
            className="progress-bar"
            style={{ width: `${(commonTotalScore / maxCommonScore) * 100}%` }}
          ></div>
        </div>
      </div>

      {data.diseaseSpecific.rheumatoidArthritis && (
        <div className="result-card">
          <h3>류마티스 관절염</h3>
          <p>통증 부위: {data.diseaseSpecific.rheumatoidArthritis.painLocations.join(', ') || '없음'}</p>
        </div>
      )}

      {data.diseaseSpecific.psoriasis && (
        <div className="result-card">
          <h3>건선</h3>
          {Object.entries(data.diseaseSpecific.psoriasis.skinAreas).map(([area, symptoms]) => {
            const activeSymptoms = [];
            if (symptoms.redness) activeSymptoms.push('붉은기');
            if (symptoms.dryness) activeSymptoms.push('건조');
            if (symptoms.itching) activeSymptoms.push('가려움');
            if (symptoms.scaling) activeSymptoms.push('각질');
            
            if (activeSymptoms.length === 0) return null;
            
            return (
              <p key={area}>
                <strong>{area}:</strong> {activeSymptoms.join(', ')}
              </p>
            );
          })}
        </div>
      )}

      {data.diseaseSpecific.crohnsDisease && (
        <div className="result-card">
          <h3>크론병</h3>
          <p>배변 횟수: 하루 {data.diseaseSpecific.crohnsDisease.bowelMovements.frequency}회</p>
          <p>배변 형태: {data.diseaseSpecific.crohnsDisease.bowelMovements.form}</p>
          <p>복통 위치: {data.diseaseSpecific.crohnsDisease.abdominalPainLocation.join(', ') || '없음'}</p>
        </div>
      )}

      {data.diseaseSpecific.type1Diabetes && (
        <div className="result-card">
          <h3>제1형 당뇨병</h3>
          <p>공복 혈당: {data.diseaseSpecific.type1Diabetes.bloodSugar.fasting} mg/dL</p>
          <p>식후 혈당: {data.diseaseSpecific.type1Diabetes.bloodSugar.postprandial} mg/dL</p>
          <p>인슐린 투여 시간: {data.diseaseSpecific.type1Diabetes.insulin.time || '미기록'}</p>
          <p>인슐린 용량: {data.diseaseSpecific.type1Diabetes.insulin.dosage} 단위</p>
        </div>
      )}

      {data.diseaseSpecific.multipleSclerosis && (
        <div className="result-card">
          <h3>다발성 경화증</h3>
          <p>시야 흐림: {data.diseaseSpecific.multipleSclerosis.visionBlur ? '있음' : '없음'}</p>
          <p>감각 둔화: {data.diseaseSpecific.multipleSclerosis.sensoryDullness ? '있음' : '없음'}</p>
          <p>보행 거리: {data.diseaseSpecific.multipleSclerosis.walkingDistance}미터</p>
          <p>보행 시간: {data.diseaseSpecific.multipleSclerosis.walkingTime}분</p>
        </div>
      )}

      {data.diseaseSpecific.lupus && (
        <div className="result-card">
          <h3>루푸스</h3>
          <p>얼굴 발진: {data.diseaseSpecific.lupus.facialRash ? '있음' : '없음'}</p>
          <p>입안 궤양: {data.diseaseSpecific.lupus.oralUlcers ? '있음' : '없음'}</p>
          <p>햇빛 노출 시간: {data.diseaseSpecific.lupus.sunlightExposure}시간</p>
          {data.diseaseSpecific.lupus.uvIndex && (
            <p>현재 자외선 수치 (UV Index): {data.diseaseSpecific.lupus.uvIndex}</p>
          )}
          
          {data.diseaseSpecific.lupus.dailyUVIndex && data.diseaseSpecific.lupus.dailyUVIndex.length > 0 && (
            <div className="uv-index-result">
              <h4>이틀치 시간대별 자외선 지수</h4>
              <div className="uv-index-days-result">
                {data.diseaseSpecific.lupus.dailyUVIndex.map((day, dayIndex) => (
                  <div key={day.date} className="uv-index-day-result">
                    <div className="day-header-result">
                      <span className="day-date-result">{day.date.split('-')[2]}일({day.dayName})</span>
                    </div>
                    <div className="time-slots-result">
                      {day.timeSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="time-slot-result">
                          <div className="time-range-result">{slot.timeRange}</div>
                          <div className="uv-index-value">{slot.uvIndex}</div>
                          <div
                            className="uv-status-badge-result"
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
        </div>
      )}

      {data.diseaseSpecific.sjogrensSyndrome && (
        <div className="result-card">
          <h3>쇼그렌 증후군</h3>
          <p>눈물 분비량: {data.diseaseSpecific.sjogrensSyndrome.tearSecretion} / 10</p>
          <p>침 분비량: {data.diseaseSpecific.sjogrensSyndrome.salivaSecretion} / 10</p>
        </div>
      )}

      {data.diseaseSpecific.autoimmuneThyroid && (
        <div className="result-card">
          <h3>자가면역성 갑상선 질환</h3>
          <p>맥박: {data.diseaseSpecific.autoimmuneThyroid.pulse} bpm</p>
          <p>체온: {data.diseaseSpecific.autoimmuneThyroid.bodyTemperature}°C</p>
          <p>체중 변화: {data.diseaseSpecific.autoimmuneThyroid.weightChange > 0 ? '+' : ''}{data.diseaseSpecific.autoimmuneThyroid.weightChange} kg</p>
          <p>불면 정도: {data.diseaseSpecific.autoimmuneThyroid.insomnia} / 5점</p>
          <p>괴민 정도: {data.diseaseSpecific.autoimmuneThyroid.irritability} / 5점</p>
          <p>무기력 정도: {data.diseaseSpecific.autoimmuneThyroid.lethargy} / 5점</p>
        </div>
      )}

      <div className="disclaimer">
        <p><strong>주의사항:</strong> 이 자가진단은 참고용이며, 정확한 진단을 위해서는 전문의와 상담하시기 바랍니다.</p>
      </div>
    </div>
  );
};

export default Results;


