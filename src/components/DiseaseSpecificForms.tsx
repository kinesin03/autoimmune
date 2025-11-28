import React, { useState, useEffect } from 'react';
import { DiseaseSpecificSymptoms, RheumatoidArthritis, Psoriasis, CrohnsDisease, Type1Diabetes, MultipleSclerosis, Lupus, SjogrensSyndrome, AutoimmuneThyroid, DailyUVIndex, UVIndexTimeSlot } from '../types';
import axios from 'axios';
import { getUVIndexStatus, getUVIndexStatusText, getUVIndexStatusColor, getDayName, defaultTimeSlots } from '../utils/uvIndexHelper';
import LupusForm from './LupusForm';

interface Props {
  symptoms: DiseaseSpecificSymptoms;
  onChange: (symptoms: DiseaseSpecificSymptoms) => void;
}

const DiseaseSpecificForms: React.FC<Props> = ({ symptoms, onChange }) => {
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [uvIndex, setUvIndex] = useState<number | null>(null);

  // 앱이 나갔다가 들어올 때 선택 상태 초기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setSelectedDisease('');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 자외선 수치 가져오기 (루푸스용)
  useEffect(() => {
    const fetchUVIndex = async () => {
      try {
        // OpenUV API 또는 OpenWeatherMap API 사용
        // 환경변수에서 API 키를 가져옴 (없으면 예시 값 사용)
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        
        if (apiKey) {
          // OpenWeatherMap의 경우 UV Index는 별도 API 호출이 필요
          // 여기서는 간단히 위치 기반으로 UV Index를 가져오는 예시
          // 실제 구현 시 OpenUV API (https://www.openuv.io/) 사용 권장
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${apiKey}&units=metric`
          );
          // UV Index는 별도 API 호출 필요 (OpenUV API 등)
          // 현재는 시간대와 계절에 따른 예상값 계산
          const hour = new Date().getHours();
          const month = new Date().getMonth();
          // 간단한 예시 계산 (실제로는 API에서 가져와야 함)
          let estimatedUV = 3;
          if (month >= 5 && month <= 8) { // 여름
            if (hour >= 10 && hour <= 15) estimatedUV = 8;
            else if (hour >= 8 && hour <= 17) estimatedUV = 6;
          } else if (month >= 3 && month <= 10) { // 봄/가을
            if (hour >= 10 && hour <= 15) estimatedUV = 5;
          }
          setUvIndex(estimatedUV);
        } else {
          // API 키가 없으면 예시 값 사용
          const hour = new Date().getHours();
          const month = new Date().getMonth();
          let estimatedUV = 3;
          if (month >= 5 && month <= 8) {
            if (hour >= 10 && hour <= 15) estimatedUV = 8;
            else if (hour >= 8 && hour <= 17) estimatedUV = 6;
          } else if (month >= 3 && month <= 10) {
            if (hour >= 10 && hour <= 15) estimatedUV = 5;
          }
          setUvIndex(estimatedUV);
        }
      } catch (error) {
        console.error('UV Index를 가져올 수 없습니다:', error);
        // 오류 발생 시 기본값 설정
        setUvIndex(5);
      }
    };

    if (selectedDisease === 'lupus') {
      fetchUVIndex();
    }
  }, [selectedDisease]);

  const updateDisease = <K extends keyof DiseaseSpecificSymptoms>(
    disease: K,
    data: DiseaseSpecificSymptoms[K]
  ) => {
    onChange({ ...symptoms, [disease]: data });
  };

  const painLocations = [
    '손목', '손가락', '팔꿈치', '어깨', '무릎', '발목', '발가락', '목', '허리'
  ];

  const skinAreas = [
    '얼굴', '두피', '목', '가슴', '등', '팔', '다리', '손', '발'
  ];

  const abdominalPainLocations = [
    '상복부', '중복부', '하복부', '우측', '좌측', '전체'
  ];

  return (
    <div className="form-section">
      <h2>질환별 전조 증상 자가진단</h2>
      
      <div className="disease-selector">
        <label>진단할 질환 선택:</label>
        <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)}>
          <option value="">선택하세요</option>
          <option value="rheumatoidArthritis">류마티스 관절염</option>
          <option value="psoriasis">건선</option>
          <option value="crohnsDisease">크론병</option>
          <option value="type1Diabetes">제1형 당뇨병</option>
          <option value="multipleSclerosis">다발성 경화증</option>
          <option value="lupus">루푸스</option>
          <option value="sjogrensSyndrome">쇼그렌 증후군</option>
          <option value="autoimmuneThyroid">자가면역성 갑상선 질환</option>
        </select>
      </div>

      {selectedDisease === 'rheumatoidArthritis' && (
        <div className="disease-form">
          <h3>류마티스 관절염</h3>
          <label>통증 부위 체크:</label>
          <div className="checkbox-group">
            {painLocations.map((location) => (
              <label key={location} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(symptoms.rheumatoidArthritis?.painLocations || []).includes(location)}
                  onChange={(e) => {
                    const current = symptoms.rheumatoidArthritis?.painLocations || [];
                    const updated = e.target.checked
                      ? [...current, location]
                      : current.filter(l => l !== location);
                    updateDisease('rheumatoidArthritis', { painLocations: updated });
                  }}
                />
                {location}
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedDisease === 'psoriasis' && (
        <div className="disease-form">
          <h3>건선</h3>
          <label>피부 부위별 증상 체크:</label>
          {skinAreas.map((area) => (
            <div key={area} className="skin-area">
              <h4>{area}</h4>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={symptoms.psoriasis?.skinAreas[area]?.redness || false}
                    onChange={(e) => {
                      const current = symptoms.psoriasis?.skinAreas || {};
                      updateDisease('psoriasis', {
                        skinAreas: {
                          ...current,
                          [area]: {
                            ...current[area],
                            redness: e.target.checked,
                            dryness: current[area]?.dryness || false,
                            itching: current[area]?.itching || false,
                            scaling: current[area]?.scaling || false,
                          }
                        }
                      });
                    }}
                  />
                  붉은기
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={symptoms.psoriasis?.skinAreas[area]?.dryness || false}
                    onChange={(e) => {
                      const current = symptoms.psoriasis?.skinAreas || {};
                      updateDisease('psoriasis', {
                        skinAreas: {
                          ...current,
                          [area]: {
                            ...current[area],
                            redness: current[area]?.redness || false,
                            dryness: e.target.checked,
                            itching: current[area]?.itching || false,
                            scaling: current[area]?.scaling || false,
                          }
                        }
                      });
                    }}
                  />
                  건조
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={symptoms.psoriasis?.skinAreas[area]?.itching || false}
                    onChange={(e) => {
                      const current = symptoms.psoriasis?.skinAreas || {};
                      updateDisease('psoriasis', {
                        skinAreas: {
                          ...current,
                          [area]: {
                            ...current[area],
                            redness: current[area]?.redness || false,
                            dryness: current[area]?.dryness || false,
                            itching: e.target.checked,
                            scaling: current[area]?.scaling || false,
                          }
                        }
                      });
                    }}
                  />
                  가려움
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={symptoms.psoriasis?.skinAreas[area]?.scaling || false}
                    onChange={(e) => {
                      const current = symptoms.psoriasis?.skinAreas || {};
                      updateDisease('psoriasis', {
                        skinAreas: {
                          ...current,
                          [area]: {
                            ...current[area],
                            redness: current[area]?.redness || false,
                            dryness: current[area]?.dryness || false,
                            itching: current[area]?.itching || false,
                            scaling: e.target.checked,
                          }
                        }
                      });
                    }}
                  />
                  각질
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDisease === 'crohnsDisease' && (
        <div className="disease-form">
          <h3>크론병</h3>
          <div className="form-group">
            <label>배변 횟수 (하루):</label>
            <input
              type="number"
              min="0"
              value={symptoms.crohnsDisease?.bowelMovements.frequency || 0}
              onChange={(e) => {
                const current = symptoms.crohnsDisease || {
                  bowelMovements: { frequency: 0, form: '정상' },
                  abdominalPainLocation: []
                };
                updateDisease('crohnsDisease', {
                  ...current,
                  bowelMovements: {
                    ...current.bowelMovements,
                    frequency: parseInt(e.target.value) || 0
                  }
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>배변 형태:</label>
            <select
              value={symptoms.crohnsDisease?.bowelMovements.form || '정상'}
              onChange={(e) => {
                const current = symptoms.crohnsDisease || {
                  bowelMovements: { frequency: 0, form: '정상' },
                  abdominalPainLocation: []
                };
                updateDisease('crohnsDisease', {
                  ...current,
                  bowelMovements: {
                    ...current.bowelMovements,
                    form: e.target.value
                  }
                });
              }}
            >
              <option value="정상">정상</option>
              <option value="묽음">묽음</option>
              <option value="설사">설사</option>
              <option value="변비">변비</option>
            </select>
          </div>
          <div className="form-group">
            <label>복통 위치 체크:</label>
            <div className="checkbox-group">
              {abdominalPainLocations.map((location) => (
                <label key={location} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(symptoms.crohnsDisease?.abdominalPainLocation || []).includes(location)}
                    onChange={(e) => {
                      const current = symptoms.crohnsDisease || {
                        bowelMovements: { frequency: 0, form: '정상' },
                        abdominalPainLocation: []
                      };
                      const updated = e.target.checked
                        ? [...current.abdominalPainLocation, location]
                        : current.abdominalPainLocation.filter(l => l !== location);
                      updateDisease('crohnsDisease', {
                        ...current,
                        abdominalPainLocation: updated
                      });
                    }}
                  />
                  {location}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedDisease === 'type1Diabetes' && (
        <div className="disease-form">
          <h3>제1형 당뇨병</h3>
          <div className="form-group">
            <label>공복 혈당 (mg/dL):</label>
            <input
              type="number"
              min="0"
              value={symptoms.type1Diabetes?.bloodSugar.fasting || 0}
              onChange={(e) => {
                const current = symptoms.type1Diabetes || {
                  bloodSugar: { fasting: 0, postprandial: 0 },
                  insulin: { time: '', dosage: 0 }
                };
                updateDisease('type1Diabetes', {
                  ...current,
                  bloodSugar: {
                    ...current.bloodSugar,
                    fasting: parseInt(e.target.value) || 0
                  }
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>식후 혈당 (mg/dL):</label>
            <input
              type="number"
              min="0"
              value={symptoms.type1Diabetes?.bloodSugar.postprandial || 0}
              onChange={(e) => {
                const current = symptoms.type1Diabetes || {
                  bloodSugar: { fasting: 0, postprandial: 0 },
                  insulin: { time: '', dosage: 0 }
                };
                updateDisease('type1Diabetes', {
                  ...current,
                  bloodSugar: {
                    ...current.bloodSugar,
                    postprandial: parseInt(e.target.value) || 0
                  }
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>인슐린 투여 시간:</label>
            <input
              type="time"
              value={symptoms.type1Diabetes?.insulin.time || ''}
              onChange={(e) => {
                const current = symptoms.type1Diabetes || {
                  bloodSugar: { fasting: 0, postprandial: 0 },
                  insulin: { time: '', dosage: 0 }
                };
                updateDisease('type1Diabetes', {
                  ...current,
                  insulin: {
                    ...current.insulin,
                    time: e.target.value
                  }
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>인슐린 용량 (단위):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={symptoms.type1Diabetes?.insulin.dosage || 0}
              onChange={(e) => {
                const current = symptoms.type1Diabetes || {
                  bloodSugar: { fasting: 0, postprandial: 0 },
                  insulin: { time: '', dosage: 0 }
                };
                updateDisease('type1Diabetes', {
                  ...current,
                  insulin: {
                    ...current.insulin,
                    dosage: parseFloat(e.target.value) || 0
                  }
                });
              }}
            />
          </div>
        </div>
      )}

      {selectedDisease === 'multipleSclerosis' && (
        <div className="disease-form">
          <h3>다발성 경화증</h3>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={symptoms.multipleSclerosis?.visionBlur || false}
                onChange={(e) => {
                  const current = symptoms.multipleSclerosis || {
                    visionBlur: false,
                    sensoryDullness: false,
                    walkingDistance: 0,
                    walkingTime: 0
                  };
                  updateDisease('multipleSclerosis', {
                    ...current,
                    visionBlur: e.target.checked
                  });
                }}
              />
              시야 흐림
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={symptoms.multipleSclerosis?.sensoryDullness || false}
                onChange={(e) => {
                  const current = symptoms.multipleSclerosis || {
                    visionBlur: false,
                    sensoryDullness: false,
                    walkingDistance: 0,
                    walkingTime: 0
                  };
                  updateDisease('multipleSclerosis', {
                    ...current,
                    sensoryDullness: e.target.checked
                  });
                }}
              />
              감각 둔화
            </label>
          </div>
          <div className="form-group">
            <label>보행 거리 (미터):</label>
            <input
              type="number"
              min="0"
              value={symptoms.multipleSclerosis?.walkingDistance || 0}
              onChange={(e) => {
                const current = symptoms.multipleSclerosis || {
                  visionBlur: false,
                  sensoryDullness: false,
                  walkingDistance: 0,
                  walkingTime: 0
                };
                updateDisease('multipleSclerosis', {
                  ...current,
                  walkingDistance: parseInt(e.target.value) || 0
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>보행 시간 (분):</label>
            <input
              type="number"
              min="0"
              value={symptoms.multipleSclerosis?.walkingTime || 0}
              onChange={(e) => {
                const current = symptoms.multipleSclerosis || {
                  visionBlur: false,
                  sensoryDullness: false,
                  walkingDistance: 0,
                  walkingTime: 0
                };
                updateDisease('multipleSclerosis', {
                  ...current,
                  walkingTime: parseInt(e.target.value) || 0
                });
              }}
            />
          </div>
        </div>
      )}

      {selectedDisease === 'lupus' && (
        <LupusForm
          symptoms={symptoms.lupus}
          onUpdate={(lupusData) => updateDisease('lupus', lupusData)}
          uvIndex={uvIndex}
        />
      )}

      {selectedDisease === 'sjogrensSyndrome' && (
        <div className="disease-form">
          <h3>쇼그렌 증후군</h3>
          <div className="form-group">
            <label>눈물 분비량 (0-10):</label>
            <input
              type="range"
              min="0"
              max="10"
              value={symptoms.sjogrensSyndrome?.tearSecretion || 0}
              onChange={(e) => {
                const current = symptoms.sjogrensSyndrome || {
                  tearSecretion: 0,
                  salivaSecretion: 0
                };
                updateDisease('sjogrensSyndrome', {
                  ...current,
                  tearSecretion: parseInt(e.target.value)
                });
              }}
            />
            <span className="score">{symptoms.sjogrensSyndrome?.tearSecretion || 0}</span>
          </div>
          <div className="form-group">
            <label>침 분비량 (0-10):</label>
            <input
              type="range"
              min="0"
              max="10"
              value={symptoms.sjogrensSyndrome?.salivaSecretion || 0}
              onChange={(e) => {
                const current = symptoms.sjogrensSyndrome || {
                  tearSecretion: 0,
                  salivaSecretion: 0
                };
                updateDisease('sjogrensSyndrome', {
                  ...current,
                  salivaSecretion: parseInt(e.target.value)
                });
              }}
            />
            <span className="score">{symptoms.sjogrensSyndrome?.salivaSecretion || 0}</span>
          </div>
        </div>
      )}

      {selectedDisease === 'autoimmuneThyroid' && (
        <div className="disease-form">
          <h3>자가면역성 갑상선 질환</h3>
          <div className="form-group">
            <label>맥박 (bpm):</label>
            <input
              type="number"
              min="0"
              value={symptoms.autoimmuneThyroid?.pulse || 0}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  pulse: parseInt(e.target.value) || 0
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>체온 (°C):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={symptoms.autoimmuneThyroid?.bodyTemperature || 36.5}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  bodyTemperature: parseFloat(e.target.value) || 36.5
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>체중 변화 (kg):</label>
            <input
              type="number"
              step="0.1"
              value={symptoms.autoimmuneThyroid?.weightChange || 0}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  weightChange: parseFloat(e.target.value) || 0
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>불면 정도 (0-5):</label>
            <input
              type="range"
              min="0"
              max="5"
              value={symptoms.autoimmuneThyroid?.insomnia || 0}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  insomnia: parseInt(e.target.value)
                });
              }}
            />
            <span className="score">{symptoms.autoimmuneThyroid?.insomnia || 0}점</span>
          </div>
          <div className="form-group">
            <label>괴민 정도 (0-5):</label>
            <input
              type="range"
              min="0"
              max="5"
              value={symptoms.autoimmuneThyroid?.irritability || 0}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  irritability: parseInt(e.target.value)
                });
              }}
            />
            <span className="score">{symptoms.autoimmuneThyroid?.irritability || 0}점</span>
          </div>
          <div className="form-group">
            <label>무기력 정도 (0-5):</label>
            <input
              type="range"
              min="0"
              max="5"
              value={symptoms.autoimmuneThyroid?.lethargy || 0}
              onChange={(e) => {
                const current = symptoms.autoimmuneThyroid || {
                  pulse: 0,
                  bodyTemperature: 36.5,
                  weightChange: 0,
                  insomnia: 0,
                  irritability: 0,
                  lethargy: 0
                };
                updateDisease('autoimmuneThyroid', {
                  ...current,
                  lethargy: parseInt(e.target.value)
                });
              }}
            />
            <span className="score">{symptoms.autoimmuneThyroid?.lethargy || 0}점</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseSpecificForms;

