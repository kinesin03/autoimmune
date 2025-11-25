import React, { useEffect, useState } from 'react';
import { FlareManagementData } from '../types';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  RAInputValues,
  calculateRafiScore,
  classifyRafiRisk,
  getDefaultThresholds
} from '../utils/rheumatoidAnalysis';
import {
  PsoriasisInputValues,
  calculatePsfiScore,
  classifyPsfiRisk,
  getDefaultPsoriasisThresholds
} from '../utils/psoriasisAnalysis';
import {
  CrohnInputValues,
  calculateCfiScore,
  classifyCfiRisk,
  getDefaultCrohnThresholds
} from '../utils/crohnAnalysis';
import {
  T1DInputValues,
  calculateT1dFiScore,
  classifyT1dRisk,
  getDefaultT1DThresholds
} from '../utils/type1DiabetesAnalysis';
import {
  MSInputValues,
  calculateMsFiScore,
  classifyMsRisk,
  getDefaultMsThresholds
} from '../utils/multipleSclerosisAnalysis';
import {
  LupusInputValues,
  calculateLupusScore,
  classifyLupusRisk
} from '../utils/lupusAnalysis';
import {
  SjogrenInputValues,
  calculateSsiScore,
  classifySsiRisk,
  getDefaultSjogrenThresholds,
  getSjogrenDrivers
} from '../utils/sjogrenAnalysis';
import {
  ThyroidInputValues,
  calculateThfiScore,
  classifyThfiRisk,
  getDefaultThyroidThresholds,
  getThyroidDrivers
} from '../utils/thyroidAnalysis';
import './FlareAnalysisResults.css';

interface Props {
  data: FlareManagementData;
}

interface StoredProdromalRecord {
  date: string;
  commonSymptoms?: {
    fatigue?: number;
    bodyTemperature?: number;
    bodyAche?: number;
    anxiety?: number;
    depression?: number;
    stress?: number;
    sleepDisorder?: number;
    appetiteLoss?: number;
    abdominalPain?: number;
    jointPain?: number;
    functionalDecline?: number;
    skinPain?: number;
    itching?: number;
  };
  diseaseSpecific?: {
    rheumatoidArthritis?: {
      jointSwelling?: number;
      jointStiffness?: number;
      worseInMorning?: number;
      morningWorse?: number;
    };
    psoriasis?: {
      redness?: number;
      thickness?: number;
      scaling?: number;
    };
    crohnsDisease?: {
      bowelFrequency?: number;
      stoolConsistency?: number;
      bloodMucus?: number;
      urgency?: number;
      bloating?: number;
    };
    type1Diabetes?: {
      glucoseVariability?: number;
      hypoFrequency?: number;
      hyperFrequency?: number;
      timeInRange?: number;
      insulinMissedDose?: number;
      ketoneWarning?: number;
    };
    multipleSclerosis?: {
      visionBlur?: number;
      sensoryLoss?: number;
      balanceImpairment?: number;
      walkingScore?: number;
    };
    sjogrensSyndrome?: {
      eyeDryness?: number;
      mouthDryness?: number;
    };
    autoimmuneThyroid?: {
      restingHeartRate?: number;
      tremorSeverity?: number;
      heatIntolerance?: number;
      weightLoss?: number;
    };
  };
}

type DiseaseStatus = 'hidden' | 'loading' | 'ready' | 'empty' | 'error';

interface DriverItem {
  label: string;
  normalized: number;
  contribution: number;
}

const FlareAnalysisResults: React.FC<Props> = ({ data }) => {
  const [weeklyRisk] = useState<number[]>([15, 12, 10, 25, 18, 15, 20]);
  const [rheumatoidStatus, setRheumatoidStatus] = useState<DiseaseStatus>('hidden');
  const [rheumatoidScore, setRheumatoidScore] = useState<number>(0);
  const [rheumatoidLabel, setRheumatoidLabel] = useState<string>('');
  const [rheumatoidMessage, setRheumatoidMessage] = useState<string>('');
  const [rheumatoidDrivers, setRheumatoidDrivers] = useState<DriverItem[]>([]);
  const [rheumatoidDate, setRheumatoidDate] = useState<string | null>(null);
  const [rheumatoidLevel, setRheumatoidLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [psoriasisStatus, setPsoriasisStatus] = useState<DiseaseStatus>('hidden');
  const [psoriasisScore, setPsoriasisScore] = useState<number>(0);
  const [psoriasisLabel, setPsoriasisLabel] = useState<string>('');
  const [psoriasisMessage, setPsoriasisMessage] = useState<string>('');
  const [psoriasisDrivers, setPsoriasisDrivers] = useState<DriverItem[]>([]);
  const [psoriasisDate, setPsoriasisDate] = useState<string | null>(null);
  const [psoriasisLevel, setPsoriasisLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [crohnStatus, setCrohnStatus] = useState<DiseaseStatus>('hidden');
  const [crohnScore, setCrohnScore] = useState<number>(0);
  const [crohnLabel, setCrohnLabel] = useState<string>('');
  const [crohnMessage, setCrohnMessage] = useState<string>('');
  const [crohnDrivers, setCrohnDrivers] = useState<DriverItem[]>([]);
  const [crohnDate, setCrohnDate] = useState<string | null>(null);
  const [crohnLevel, setCrohnLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [t1dStatus, setT1dStatus] = useState<DiseaseStatus>('hidden');
  const [t1dScore, setT1dScore] = useState<number>(0);
  const [t1dLabel, setT1dLabel] = useState<string>('');
  const [t1dMessage, setT1dMessage] = useState<string>('');
  const [t1dDrivers, setT1dDrivers] = useState<DriverItem[]>([]);
  const [t1dDate, setT1dDate] = useState<string | null>(null);
  const [t1dLevel, setT1dLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [msStatus, setMsStatus] = useState<DiseaseStatus>('hidden');
  const [msScore, setMsScore] = useState<number>(0);
  const [msLabel, setMsLabel] = useState<string>('');
  const [msMessage, setMsMessage] = useState<string>('');
  const [msDrivers, setMsDrivers] = useState<DriverItem[]>([]);
  const [msDate, setMsDate] = useState<string | null>(null);
  const [msLevel, setMsLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [lupusStatus, setLupusStatus] = useState<DiseaseStatus>('hidden');
  const [lupusScore, setLupusScore] = useState<number>(0);
  const [lupusLabel, setLupusLabel] = useState<string>('');
  const [lupusMessage, setLupusMessage] = useState<string>('');
  const [lupusDrivers, setLupusDrivers] = useState<DriverItem[]>([]);
  const [lupusDate, setLupusDate] = useState<string | null>(null);
  const [lupusLevel, setLupusLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [sjogrenStatus, setSjogrenStatus] = useState<DiseaseStatus>('hidden');
  const [sjogrenScore, setSjogrenScore] = useState<number>(0);
  const [sjogrenLabel, setSjogrenLabel] = useState<string>('');
  const [sjogrenMessage, setSjogrenMessage] = useState<string>('');
  const [sjogrenDrivers, setSjogrenDrivers] = useState<DriverItem[]>([]);
  const [sjogrenDate, setSjogrenDate] = useState<string | null>(null);
  const [sjogrenLevel, setSjogrenLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  const [thyroidStatus, setThyroidStatus] = useState<DiseaseStatus>('hidden');
  const [thyroidScore, setThyroidScore] = useState<number>(0);
  const [thyroidLabel, setThyroidLabel] = useState<string>('');
  const [thyroidMessage, setThyroidMessage] = useState<string>('');
  const [thyroidDrivers, setThyroidDrivers] = useState<DriverItem[]>([]);
  const [thyroidDate, setThyroidDate] = useState<string | null>(null);
  const [thyroidLevel, setThyroidLevel] = useState<'stable' | 'caution' | 'flare'>('stable');
  
  const hasData = data.flares.length > 0 || 
                 data.stressRecords.length > 0 || 
                 data.foodRecords.length > 0 || 
                 data.sleepRecords.length > 0;

  // 예상 위험도 계산
  const expectedRisk = data.riskAnalysis?.riskScore || 15;
  const riskLevel = data.riskAnalysis?.riskLevel || 'low';
  const riskLevelText = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    critical: '매우 높음'
  };
  const riskLevelColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  };

  // 약물 복용률 계산
  const medicationAdherence = 100; // 예시
  const avgSleepHours = 6.5; // 예시
  const recommendedSleep = 7.5;

  // 요일별 위험도 색상
  const getRiskColor = (risk: number) => {
    if (risk < 20) return '#10b981'; // 초록
    if (risk < 30) return '#f59e0b'; // 노랑
    return '#ef4444'; // 빨강
  };

  useEffect(() => {
    let hasRheumatoid = false;
    let hasPsoriasis = false;
    let hasCrohn = false;
    let hasT1d = false;
    let hasMs = false;
    let hasLupus = false;
    let hasSjogren = false;
    let hasThyroid = false;

    try {
      const diseases = JSON.parse(localStorage.getItem('userDiseases') || '[]');
      if (Array.isArray(diseases)) {
        hasRheumatoid = diseases.includes('류마티스 관절염');
        hasPsoriasis = diseases.includes('건선');
        hasCrohn = diseases.includes('크론병');
        hasT1d = diseases.includes('제1형 당뇨병');
        hasMs = diseases.includes('다발성 경화증(MS)');
        hasLupus = diseases.includes('루푸스(SLE)');
        hasSjogren = diseases.includes('쇼그렌 증후군');
        hasThyroid = diseases.includes('자가면역성 갑상선 질환');
      }

      setRheumatoidStatus(hasRheumatoid ? 'loading' : 'hidden');
      setPsoriasisStatus(hasPsoriasis ? 'loading' : 'hidden');
      setCrohnStatus(hasCrohn ? 'loading' : 'hidden');
      setT1dStatus(hasT1d ? 'loading' : 'hidden');
      setMsStatus(hasMs ? 'loading' : 'hidden');
      setLupusStatus(hasLupus ? 'loading' : 'hidden');
      setSjogrenStatus(hasSjogren ? 'loading' : 'hidden');
      setThyroidStatus(hasThyroid ? 'loading' : 'hidden');

      if (!hasRheumatoid && !hasPsoriasis && !hasCrohn && !hasT1d && !hasMs && !hasLupus && !hasSjogren && !hasThyroid) {
        return;
      }

      const stored = localStorage.getItem('prodromalSymptomRecords');
      if (!stored) {
        if (hasRheumatoid) setRheumatoidStatus('empty');
        if (hasPsoriasis) setPsoriasisStatus('empty');
        if (hasCrohn) setCrohnStatus('empty');
        if (hasT1d) setT1dStatus('empty');
        if (hasMs) setMsStatus('empty');
        if (hasLupus) setLupusStatus('empty');
        if (hasSjogren) setSjogrenStatus('empty');
        if (hasThyroid) setThyroidStatus('empty');
        return;
      }

      const records: StoredProdromalRecord[] = JSON.parse(stored);
      if (!Array.isArray(records) || records.length === 0) {
        if (hasRheumatoid) setRheumatoidStatus('empty');
        if (hasPsoriasis) setPsoriasisStatus('empty');
        if (hasCrohn) setCrohnStatus('empty');
        if (hasT1d) setT1dStatus('empty');
        if (hasMs) setMsStatus('empty');
        if (hasLupus) setLupusStatus('empty');
        if (hasSjogren) setSjogrenStatus('empty');
        if (hasThyroid) setThyroidStatus('empty');
        return;
      }

      const latestRecord = records.reduce((latest, current) => {
        if (!latest) return current;
        return current.date > latest.date ? current : latest;
      }, records[0]);

      if (hasRheumatoid) {
        const raSpecific = latestRecord?.diseaseSpecific?.rheumatoidArthritis;
        if (!raSpecific) {
          setRheumatoidStatus('empty');
        } else {
          const inputs: RAInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            jointPain: latestRecord.commonSymptoms?.jointPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord.commonSymptoms?.itching ?? 0,
            jointSwelling: raSpecific.jointSwelling ?? 0,
            jointStiffness: raSpecific.jointStiffness ?? 0,
            morningWorse: raSpecific.worseInMorning ?? raSpecific.morningWorse ?? 0
          };

          const thresholds = getDefaultThresholds();
          const calculation = calculateRafiScore(inputs, thresholds);
          const risk = classifyRafiRisk(calculation.score);

          setRheumatoidScore(calculation.score);
          setRheumatoidLabel(risk.label);
          setRheumatoidMessage(risk.message);
          setRheumatoidLevel(risk.level);
          setRheumatoidDrivers(
            calculation.contributions
              .filter((item) => item.contribution > 0)
              .slice(0, 3)
              .map((item) => ({
                label: item.label,
                normalized: item.normalized,
                contribution: item.contribution
              }))
          );
          setRheumatoidDate(latestRecord.date);
          setRheumatoidStatus('ready');
        }
      }

      if (hasPsoriasis) {
        const psSpecific = latestRecord?.diseaseSpecific?.psoriasis;
        if (!psSpecific) {
          setPsoriasisStatus('empty');
        } else {
          const inputs: PsoriasisInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            jointPain: latestRecord.commonSymptoms?.jointPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord.commonSymptoms?.itching ?? 0,
            erythema: psSpecific.redness ?? 0,
            skinThickness: psSpecific.thickness ?? 0,
            scaling: psSpecific.scaling ?? 0
          };

          const thresholds = getDefaultPsoriasisThresholds();
          const calculation = calculatePsfiScore(inputs, thresholds);
          const risk = classifyPsfiRisk(calculation.score);

          setPsoriasisScore(calculation.score);
          setPsoriasisLabel(risk.label);
          setPsoriasisMessage(risk.message);
          setPsoriasisLevel(risk.level);
          setPsoriasisDrivers(
            calculation.contributions
              .filter((item) => item.contribution > 0)
              .slice(0, 3)
              .map((item) => ({
                label: item.label,
                normalized: item.normalized,
                contribution: item.contribution
              }))
          );
          setPsoriasisDate(latestRecord.date);
          setPsoriasisStatus('ready');
        }
      }

      if (hasCrohn) {
        const crohnSpecific = latestRecord?.diseaseSpecific?.crohnsDisease;
        if (!crohnSpecific) {
          setCrohnStatus('empty');
        } else {
          const inputs: CrohnInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            jointPain: latestRecord.commonSymptoms?.jointPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord.commonSymptoms?.itching ?? 0,
            stoolFrequency: crohnSpecific.bowelFrequency ?? 0,
            stoolLooseness: crohnSpecific.stoolConsistency ?? 0,
            bloodMucus: crohnSpecific.bloodMucus ?? 0,
            urgency: crohnSpecific.urgency ?? 0,
            bloating: crohnSpecific.bloating ?? 0
          };

          const thresholds = getDefaultCrohnThresholds();
          const calculation = calculateCfiScore(inputs, thresholds);
          const risk = classifyCfiRisk(calculation.score);

          setCrohnScore(calculation.score);
          setCrohnLabel(risk.label);
          setCrohnMessage(risk.message);
          setCrohnLevel(risk.level);
          setCrohnDrivers(
            calculation.contributions
              .filter((item) => item.contribution > 0)
              .slice(0, 3)
              .map((item) => ({
                label: item.label,
                normalized: item.normalized,
                contribution: item.contribution
              }))
          );
          setCrohnDate(latestRecord.date);
          setCrohnStatus('ready');
        }
      }

      if (hasT1d) {
        const t1dSpecific = latestRecord?.diseaseSpecific?.type1Diabetes;
        if (!t1dSpecific) {
          setT1dStatus('empty');
        } else {
          const inputs: T1DInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            glucoseVariability: t1dSpecific.glucoseVariability ?? 0,
            hypoFrequency: t1dSpecific.hypoFrequency ?? 0,
            hyperFrequency: t1dSpecific.hyperFrequency ?? 0,
            timeInRange: t1dSpecific.timeInRange ?? 100,
            insulinMissedDose: t1dSpecific.insulinMissedDose ?? 0,
            ketoneWarning: t1dSpecific.ketoneWarning ?? 0
          };

          const thresholds = getDefaultT1DThresholds();
          const calculation = calculateT1dFiScore(inputs, thresholds);
          const risk = classifyT1dRisk(calculation.score);

          setT1dScore(calculation.score);
          setT1dLabel(risk.label);
          setT1dMessage(risk.message);
          setT1dLevel(risk.level);
          setT1dDrivers(
            calculation.contributions
              .filter((item) => item.contribution > 0)
              .slice(0, 3)
              .map((item) => ({
                label: item.label,
                normalized: item.normalized,
                contribution: item.contribution
              }))
          );
          setT1dDate(latestRecord.date);
          setT1dStatus('ready');
        }
      }

      if (hasMs) {
        const msSpecific = latestRecord?.diseaseSpecific?.multipleSclerosis;
        if (!msSpecific) {
          setMsStatus('empty');
        } else {
          const inputs: MSInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord.commonSymptoms?.itching ?? 0,
            visionBlur: msSpecific.visionBlur ?? 0,
            sensoryLoss: msSpecific.sensoryLoss ?? 0,
            balanceImpairment: msSpecific.balanceImpairment ?? 0,
            walkingScore: msSpecific.walkingScore ?? 0
          };

          const thresholds = getDefaultMsThresholds();
          const calculation = calculateMsFiScore(inputs, thresholds);
          const risk = classifyMsRisk(calculation.score);

          setMsScore(calculation.score);
          setMsLabel(risk.label);
          setMsMessage(risk.message);
          setMsLevel(risk.level);
          setMsDrivers(
            calculation.contributions
              .filter((item) => item.contribution > 0)
              .slice(0, 3)
              .map((item) => ({
                label: item.label,
                normalized: item.normalized,
                contribution: item.contribution
              }))
          );
          setMsDate(latestRecord.date);
          setMsStatus('ready');
        }
      }

      if (hasLupus) {
        const lupusSpecific = latestRecord?.diseaseSpecific?.lupus;
        if (!lupusSpecific) {
          setLupusStatus('empty');
        } else {
          const bodyTemp = latestRecord.commonSymptoms?.bodyTemperature ?? 36.5;
          const feverSeverity = Math.max(0, Math.min(10, (bodyTemp - 36.5) * 4));
          const fatigue = latestRecord.commonSymptoms?.fatigue ?? 0;
          const inputs: LupusInputValues = {
            fatigue,
            fever: feverSeverity,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            jointPain: latestRecord.commonSymptoms?.jointPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itch: latestRecord.commonSymptoms?.itching ?? 0,
            sunExposure: Math.max(0, Math.min(120, lupusSpecific.sunlightExposure ?? 0)),
            facialRash:
              typeof lupusSpecific.facialRash === 'number'
                ? lupusSpecific.facialRash
                : lupusSpecific.facialRash
                ? 10
                : 0,
            oralUlcer:
              typeof lupusSpecific.oralUlcer === 'number'
                ? lupusSpecific.oralUlcer
                : lupusSpecific.oralUlcers
                ? 10
                : 0
          };

          const calculation = calculateLupusScore(inputs);
          const risk = classifyLupusRisk(calculation.score);

          setLupusScore(calculation.score);
          setLupusLabel(risk.label);
          setLupusMessage(risk.message);
          setLupusLevel(risk.level);
          setLupusDrivers(
            calculation.contributions.slice(0, 3).map((item) => ({
              label: item.label,
              normalized: item.normalized,
              contribution: item.contribution
            }))
          );
          setLupusDate(latestRecord.date);
          setLupusStatus('ready');
        }
      }

      if (hasSjogren) {
        const sjogrenSpecific = latestRecord?.diseaseSpecific?.sjogrensSyndrome;
        if (!sjogrenSpecific) {
          setSjogrenStatus('empty');
        } else {
          const inputs: SjogrenInputValues = {
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord.commonSymptoms?.itching ?? 0,
            oralDryness: sjogrenSpecific.mouthDryness ?? 0,
            ocularDryness: sjogrenSpecific.eyeDryness ?? 0
          };

          const thresholds = getDefaultSjogrenThresholds();
          const score = calculateSsiScore(inputs, thresholds);
          const risk = classifySsiRisk(score);
          const drivers = getSjogrenDrivers(inputs, thresholds);

          let level: 'stable' | 'caution' | 'flare' = 'stable';
          let label = '안정 단계';
          if (score >= 60) {
            level = 'flare';
            label = '고위험 flare 단계';
          } else if (score >= 30) {
            level = 'caution';
            label = '주의 단계';
          }

          setSjogrenScore(score);
          setSjogrenLabel(label);
          setSjogrenMessage(risk);
          setSjogrenLevel(level);
          setSjogrenDrivers(
            drivers.map((d) => ({
              label: d.name,
              normalized: d.contribution / 100,
              contribution: d.contribution
            }))
          );
          setSjogrenDate(latestRecord.date);
          setSjogrenStatus('ready');
        }
      }

      if (hasThyroid) {
        const thyroidSpecific = latestRecord?.diseaseSpecific?.autoimmuneThyroid;
        if (!thyroidSpecific) {
          setThyroidStatus('empty');
        } else {
          // 증상일지 필드를 Python 코드 필드로 매핑
          // pulse -> restingHeartRate
          // weightChange -> weightLoss (음수면 0, 양수면 그대로, 최대 10으로 제한)
          // tremorSeverity, heatIntolerance는 증상일지에 없으므로 기본값 0 사용
          const pulse = (thyroidSpecific as any).pulse ?? 70;
          const weightChange = (thyroidSpecific as any).weightChange ?? 0;
          const weightLoss = Math.max(0, Math.min(10, weightChange)); // 체중 감소는 0-10 스케일
          
          const inputs: ThyroidInputValues = {
            restingHeartRate: pulse,
            tremorSeverity: (thyroidSpecific as any).tremorSeverity ?? 0,
            heatIntolerance: (thyroidSpecific as any).heatIntolerance ?? 0,
            weightLoss: weightLoss,
            fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? (thyroidSpecific as any).bodyTemperature ?? 36.5,
            myalgia: latestRecord.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord.commonSymptoms?.depression ?? 0,
            stress: latestRecord.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord.commonSymptoms?.abdominalPain ?? 0,
            functionLoss: latestRecord.commonSymptoms?.functionalDecline ?? 0
          };

          const thresholds = getDefaultThyroidThresholds();
          const score = calculateThfiScore(inputs, thresholds);
          const risk = classifyThfiRisk(score);
          const drivers = getThyroidDrivers(inputs, thresholds);

          let level: 'stable' | 'caution' | 'flare' = 'stable';
          let label = '안정 단계';
          if (score >= 60) {
            level = 'flare';
            label = '고위험 flare 단계';
          } else if (score >= 30) {
            level = 'caution';
            label = '주의 단계';
          }

          setThyroidScore(score);
          setThyroidLabel(label);
          setThyroidMessage(risk);
          setThyroidLevel(level);
          setThyroidDrivers(
            drivers.map((d) => ({
              label: d.name,
              normalized: d.contribution / 100,
              contribution: d.contribution
            }))
          );
          setThyroidDate(latestRecord.date);
          setThyroidStatus('ready');
        }
      }
    } catch (error) {
      console.error('Failed to load autoimmune analysis:', error);
      if (hasRheumatoid) setRheumatoidStatus('error');
      if (hasPsoriasis) setPsoriasisStatus('error');
      if (hasCrohn) setCrohnStatus('error');
      if (hasT1d) setT1dStatus('error');
      if (hasMs) setMsStatus('error');
      if (hasLupus) setLupusStatus('error');
      if (hasSjogren) setSjogrenStatus('error');
      if (hasThyroid) setThyroidStatus('error');
    }
  }, []);

  return (
    <div className="analysis-results">
      {/* 질환별 AI 카드 (상단에 표시) */}
      {rheumatoidStatus !== 'hidden' && (
        <div className="analysis-card disease-card rheumatoid-card">
          <h3>류마티스 AI 분석 (RAFI-100)</h3>
          {rheumatoidStatus === 'loading' && (
            <p className="disease-helper-text">최신 증상 데이터를 불러오는 중입니다...</p>
          )}
          {rheumatoidStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {rheumatoidStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 류마티스 관절염 전용 항목을 기록하면 맞춤형 AI 분석이 제공됩니다.
            </p>
          )}
          {rheumatoidStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {rheumatoidScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${rheumatoidLevel}`}>
                  {rheumatoidLabel}
                </div>
              </div>
              <p className="disease-message">{rheumatoidMessage}</p>
              {rheumatoidDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(rheumatoidDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {rheumatoidDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {rheumatoidDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {psoriasisStatus !== 'hidden' && (
        <div className="analysis-card disease-card psoriasis-card">
          <h3>건선 AI 분석 (PSFI-100)</h3>
          {psoriasisStatus === 'loading' && (
            <p className="disease-helper-text">최신 피부 증상 데이터를 불러오는 중입니다...</p>
          )}
          {psoriasisStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {psoriasisStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 건선 항목(붉은기·두께·인설·가려움 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {psoriasisStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {psoriasisScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${psoriasisLevel}`}>
                  {psoriasisLabel}
                </div>
              </div>
              <p className="disease-message">{psoriasisMessage}</p>
              {psoriasisDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(psoriasisDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {psoriasisDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {psoriasisDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {crohnStatus !== 'hidden' && (
        <div className="analysis-card disease-card crohn-card">
          <h3>크론병 AI 분석 (CFI-100)</h3>
          {crohnStatus === 'loading' && (
            <p className="disease-helper-text">최신 장 증상 데이터를 불러오는 중입니다...</p>
          )}
          {crohnStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {crohnStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 크론병 항목(배변 횟수, 묽은 정도, 혈변 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {crohnStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {crohnScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${crohnLevel}`}>
                  {crohnLabel}
                </div>
              </div>
              <p className="disease-message">{crohnMessage}</p>
              {crohnDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(crohnDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {crohnDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {crohnDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {t1dStatus !== 'hidden' && (
        <div className="analysis-card disease-card t1d-card">
          <h3>제1형 당뇨병 AI 분석 (T1D-FI)</h3>
          {t1dStatus === 'loading' && (
            <p className="disease-helper-text">최신 혈당 데이터를 불러오는 중입니다...</p>
          )}
          {t1dStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {t1dStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 제1형 당뇨 항목(혈당 변동성, 저/고혈당 횟수 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {t1dStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {t1dScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${t1dLevel}`}>
                  {t1dLabel}
                </div>
              </div>
              <p className="disease-message">{t1dMessage}</p>
              {t1dDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(t1dDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {t1dDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {t1dDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {msStatus !== 'hidden' && (
        <div className="analysis-card disease-card ms-card">
          <h3>다발성 경화증 AI 분석 (MS-FI)</h3>
          {msStatus === 'loading' && (
            <p className="disease-helper-text">최신 신경학적 증상 데이터를 불러오는 중입니다...</p>
          )}
          {msStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {msStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 다발성 경화증 항목(시야, 감각, 균형, 보행 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {msStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {msScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${msLevel}`}>
                  {msLabel}
                </div>
              </div>
              <p className="disease-message">{msMessage}</p>
              {msDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(msDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {msDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {msDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {lupusStatus !== 'hidden' && (
        <div className="analysis-card disease-card lupus-card">
          <h3>루푸스 AI 분석 (Lupus-FI)</h3>
          {lupusStatus === 'loading' && (
            <p className="disease-helper-text">최신 루푸스 증상 데이터를 불러오는 중입니다...</p>
          )}
          {lupusStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {lupusStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 루푸스 항목(햇빛 노출, 발진, 구강 궤양 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {lupusStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {lupusScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${lupusLevel}`}>
                  {lupusLabel}
                </div>
              </div>
              <p className="disease-message">{lupusMessage}</p>
              {lupusDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(lupusDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {lupusDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {lupusDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {sjogrenStatus !== 'hidden' && (
        <div className="analysis-card disease-card sjogren-card">
          <h3>쇼그렌 증후군 AI 분석 (SSI-100)</h3>
          {sjogrenStatus === 'loading' && (
            <p className="disease-helper-text">최신 건조 증상 데이터를 불러오는 중입니다...</p>
          )}
          {sjogrenStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {sjogrenStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 쇼그렌 증후군 항목(구강 건조, 안구 건조 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {sjogrenStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {sjogrenScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${sjogrenLevel}`}>
                  {sjogrenLabel}
                </div>
              </div>
              <p className="disease-message">{sjogrenMessage}</p>
              {sjogrenDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(sjogrenDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {sjogrenDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {sjogrenDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {thyroidStatus !== 'hidden' && (
        <div className="analysis-card disease-card thyroid-card">
          <h3>자가면역성 갑상선 질환 AI 분석 (ThFI-100)</h3>
          {thyroidStatus === 'loading' && (
            <p className="disease-helper-text">최신 갑상선 증상 데이터를 불러오는 중입니다...</p>
          )}
          {thyroidStatus === 'error' && (
            <p className="disease-helper-text">
              분석 데이터를 불러오지 못했습니다. 페이지를 새로고침하거나 증상일지를 다시 저장해주세요.
            </p>
          )}
          {thyroidStatus === 'empty' && (
            <p className="disease-helper-text">
              증상일지에서 자가면역성 갑상선 질환 항목(심박수, 떨림, 열 불편감, 체중 감소 등)을 기록하면 AI 분석이 활성화됩니다.
            </p>
          )}
          {thyroidStatus === 'ready' && (
            <>
              <div className="disease-score-row">
                <div className="disease-score-value">
                  {thyroidScore.toFixed(1)}
                  <span>/100</span>
                </div>
                <div className={`disease-risk-badge ${thyroidLevel}`}>
                  {thyroidLabel}
                </div>
              </div>
              <p className="disease-message">{thyroidMessage}</p>
              {thyroidDate && (
                <p className="disease-helper-text">
                  기록일: {new Date(thyroidDate).toLocaleDateString('ko-KR')}
                </p>
              )}
              {thyroidDrivers.length > 0 && (
                <div className="disease-driver-list">
                  {thyroidDrivers.map((driver) => (
                    <div key={driver.label} className="disease-driver-item">
                      <div className="disease-driver-header">
                        <span>{driver.label}</span>
                        <span>{Math.round(driver.normalized * 100)}%</span>
                      </div>
                      <div className="disease-driver-bar">
                        <div
                          className="disease-driver-fill"
                          style={{ width: `${driver.normalized * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 위험 요인 분석 카드 */}
      <div className="risk-factors-card">
        <h3 className="section-title">위험 요인 분석</h3>
        <div className="risk-factors-grid">
          <div className="risk-factor-item positive">
            <CheckCircle2 size={24} className="factor-icon" />
            <div className="factor-content">
              <div className="factor-title">약물 복용 규칙적</div>
              <div className="factor-detail">지난 7일 {medicationAdherence}% 복용</div>
            </div>
          </div>
          <div className="risk-factor-item warning">
            <AlertTriangle size={24} className="factor-icon" />
            <div className="factor-content">
              <div className="factor-title">수면 부족 주의</div>
              <div className="factor-detail">평균 {avgSleepHours}시간 (권장: {recommendedSleep}-8시간)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 스트레스 상관 분석 */}
      {data.stressCorrelation && data.flares.length > 0 && data.stressRecords.length > 0 && (
        <div className="analysis-card">
          <h3>스트레스 상관 분석</h3>
          <div className="correlation-info">
            <div className="correlation-value">
              <span>상관계수: {data.stressCorrelation.correlation.toFixed(2)}</span>
            </div>
            {data.stressCorrelation.averageDaysToFlare > 0 && (
              <div className="correlation-detail">
                <span>평균 Flare 발생까지: {data.stressCorrelation.averageDaysToFlare}일</span>
              </div>
            )}
            <div className="correlation-detail">
              <span>스트레스 높은 주의 Flare: {data.stressCorrelation.highStressFlareCount}회</span>
            </div>
          </div>
          <div className="correlation-message">
            {data.stressCorrelation.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* 음식 상관 분석 */}
      {data.foodCorrelations.length > 0 && (
        <div className="analysis-card">
          <h3>음식 상관 분석</h3>
          <div className="food-correlations">
            {data.foodCorrelations.map((correlation, i) => (
              <div 
                key={i} 
                className={`food-item food-${correlation.recommendation}`}
              >
                <div className="food-header">
                  <span className="food-name">{correlation.food}</span>
                  <span className={`food-recommendation rec-${correlation.recommendation}`}>
                    {correlation.recommendation === 'avoid' ? '피하기' :
                     correlation.recommendation === 'moderate' ? '주의' : '안전'}
                  </span>
                </div>
                <div className="food-stats">
                  <span>Flare 확률: {correlation.flareProbability}%</span>
                  {correlation.averageHoursToSymptom > 0 && (
                    <span>평균 증상 발생: {correlation.averageHoursToSymptom}시간 후</span>
                  )}
                </div>
                <div className="food-message">
                  {correlation.message.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수면 상관 분석 */}
      {data.sleepCorrelation && data.flares.length > 0 && data.sleepRecords.length > 0 && (
        <div className="analysis-card">
          <h3>수면 상관 분석</h3>
          <div className="correlation-info">
            <div className="correlation-value">
              <span>상관계수: {data.sleepCorrelation.correlation.toFixed(2)}</span>
            </div>
            <div className="correlation-detail">
              <span>권장 수면 시간: {data.sleepCorrelation.recommendedHours}시간</span>
            </div>
          </div>
          <div className="correlation-message">
            {data.sleepCorrelation.message.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlareAnalysisResults;

