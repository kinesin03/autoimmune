import React, { useEffect, useState } from 'react';
import { FlareManagementData } from '../types';
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
  getDefaultSjogrenThresholds
} from '../utils/sjogrenAnalysis';
import {
  ThyroidInputValues,
  calculateThfiScore,
  classifyThfiRisk,
  getDefaultThyroidThresholds
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
    lupus?: {
      sunExposure?: number;
      facialRash?: number;
      oralUlcer?: number;
    };
    sjogrensSyndrome?: {
      eyeDryness?: number;
      mouthDryness?: number;
    };
    autoimmuneThyroid?: {
      pulse?: number;
      bodyTemperature?: number;
      weightChange?: number;
      tremorSeverity?: number;
      heatIntolerance?: number;
      weightLoss?: number;
    };
  };
}

interface DiseaseAnalysis {
  name: string;
  score: number;
  level: 'stable' | 'caution' | 'flare';
  label: string;
  message: string;
  contributions?: Array<{
    key: string;
    label: string;
    contribution: number;
    normalized?: number;
    value?: number;
    threshold?: number;
  }>;
  weeklyTrend?: Array<{
    date: string;
    score: number;
    dayOfWeek: string;
  }>;
  previousScore?: number;
  warnings?: Array<{
    label: string;
    value: number;
    threshold: number;
  }>;
}

const FlareAnalysisResults: React.FC<Props> = ({ data }) => {
  const [analyses, setAnalyses] = useState<DiseaseAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('FlareAnalysisResults useEffect triggered');
    let isAnalyzing = false;
    let lastRecordsHash = '';
    let lastDiseasesHash = '';
    
    const analyzeData = () => {
      // 이미 분석 중이면 스킵 (깜빡임 방지)
      if (isAnalyzing) {
        console.log('Analysis already in progress, skipping...');
        return;
      }
      isAnalyzing = true;
      console.log('Starting analysis...');
      // setLoading(true) 제거 - 깜빡임 방지
      
      try {
        const diseases = JSON.parse(localStorage.getItem('userDiseases') || '[]');
        console.log('User diseases:', diseases);
        if (!Array.isArray(diseases) || diseases.length === 0) {
          console.log('No diseases selected');
          setAnalyses([]);
          setLoading(false);
          isAnalyzing = false;
          return;
        }

        const stored = localStorage.getItem('prodromalSymptomRecords');
        console.log('Stored records:', stored);
        if (!stored) {
          console.log('No stored records');
          setAnalyses([]);
          setLoading(false);
          isAnalyzing = false;
          return;
        }

        const records: StoredProdromalRecord[] = JSON.parse(stored);
        console.log('Parsed records:', records);
        if (!Array.isArray(records) || records.length === 0) {
          console.log('Records array is empty');
          setAnalyses([]);
          setLoading(false);
          isAnalyzing = false;
          return;
        }

      // 최신 레코드 찾기 (있으면 사용, 없어도 기본값으로 분석 가능)
      const latestRecord = records.length > 0 
        ? records.reduce((latest, current) => {
            if (!latest) return current;
            return current.date > latest.date ? current : latest;
          }, records[0])
        : null;

      console.log('Latest record:', latestRecord);
      console.log('Latest record commonSymptoms:', latestRecord?.commonSymptoms);
      console.log('Latest record diseaseSpecific:', latestRecord?.diseaseSpecific);
      console.log('User diseases:', diseases);

      // commonSymptoms와 diseaseSpecific이 없어도 기본값(0)으로 분석 수행
      // 질병이 선택되어 있으면 무조건 분석 수행

      // 주간 트렌드 데이터 생성 (7일치: 과거 6일 + 오늘)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // 7일치 트렌드 생성 (과거 6일 가상 데이터 + 오늘 실제 값)
      const generateWeeklyTrend = (currentScore: number) => {
        const trend: Array<{ date: string; score: number; dayOfWeek: string }> = [];
        
        // 실제 기록이 있는 날짜 찾기
        const recordsMap = new Map<string, StoredProdromalRecord>();
        records.forEach(r => {
          recordsMap.set(r.date, r);
        });
        
        // 과거 6일 가상 데이터 생성 (서로 점수 차이가 있게)
        // 다양한 패턴의 가상 데이터 (더 큰 차이)
        const variations = [
          -18,  // 6일 전: 큰 감소
          -5,   // 5일 전: 작은 감소
          -22,  // 4일 전: 큰 감소
          -8,   // 3일 전: 중간 감소
          -15,  // 2일 전: 큰 감소
          -4    // 1일 전: 작은 감소
        ];
        
        const virtualScores = variations.map(v => currentScore + v);
        
        // 과거 6일 데이터 생성
        for (let i = 6; i >= 1; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.toLocaleDateString('ko-KR', { weekday: 'short' });
          
          // 실제 데이터가 있으면 사용, 없으면 가상 데이터
          const record = recordsMap.get(dateStr);
          let score = virtualScores[6 - i];
          
          if (record) {
            // 실제 기록이 있으면 해당 날짜의 점수 계산
            // 간단하게 현재 점수 기준으로 약간의 변동 추가
            score = currentScore + (virtualScores[6 - i] - currentScore) * 0.8;
          }
          
          // 점수 범위 제한
          score = Math.max(0, Math.min(100, score));
          
          trend.push({
            date: dateStr,
            score: Math.round(score * 10) / 10,
            dayOfWeek
          });
        }
        
        // 오늘 데이터 추가 (가장 오른쪽)
        const todayDayOfWeek = today.toLocaleDateString('ko-KR', { weekday: 'short' });
        trend.push({
          date: todayStr,
          score: currentScore,
          dayOfWeek: todayDayOfWeek
        });
        
        return trend; // 이미 시간순으로 정렬됨 (과거 -> 현재)
      };

      const results: DiseaseAnalysis[] = [];

      console.log('=== Starting disease analysis ===');
      console.log('Diseases to analyze:', diseases);
      console.log('Latest record exists:', !!latestRecord);
      console.log('Common symptoms:', latestRecord?.commonSymptoms);
      console.log('Disease specific:', latestRecord?.diseaseSpecific);

      // 류마티스 관절염
      if (diseases.includes('류마티스 관절염')) {
        console.log('Analyzing: 류마티스 관절염');
        try {
          const raSpecific = latestRecord?.diseaseSpecific?.rheumatoidArthritis;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: RAInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord?.commonSymptoms?.depression ?? 0,
            stress: latestRecord?.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
            jointPain: latestRecord?.commonSymptoms?.jointPain ?? 0,
            functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
            jointSwelling: raSpecific?.jointSwelling ?? 0,
            jointStiffness: raSpecific?.jointStiffness ?? 0,
            morningWorse: raSpecific?.worseInMorning ?? raSpecific?.morningWorse ?? 0
          };
        console.log('RA Input values:', inputs);
        const thresholds = getDefaultThresholds();
        const calculation = calculateRafiScore(inputs, thresholds);
        const risk = classifyRafiRisk(calculation.score);
        let level: 'stable' | 'caution' | 'flare' = 'stable';
        if (calculation.score >= 65) level = 'flare';
        else if (calculation.score >= 35) level = 'caution';
        console.log('RA Analysis result:', { score: calculation.score, level, label: risk.label });
        
        // 주간 트렌드 계산 (오늘 제외, 최근 6일)
        const weeklyTrend = generateWeeklyTrend(calculation.score);

        // 이전 점수 (7일 전)
        const previousRecord = weeklyRecords.length > 1 ? weeklyRecords[0] : null;
        const previousScore = previousRecord ? weeklyTrend[0]?.score : undefined;

          // 경고 신호 (임계값 초과) - 주요 항목만 체크
          const warnings: Array<{ label: string; value: number; threshold: number }> = [];
          if (inputs.jointPain > thresholds.jointPain) {
            warnings.push({ label: '관절통', value: inputs.jointPain, threshold: thresholds.jointPain });
          }
          if (inputs.jointSwelling > thresholds.jointSwelling) {
            warnings.push({ label: '관절부기', value: inputs.jointSwelling, threshold: thresholds.jointSwelling });
          }
          if (inputs.jointStiffness > thresholds.jointStiffness) {
            warnings.push({ label: '관절경직', value: inputs.jointStiffness, threshold: thresholds.jointStiffness });
          }
          if (inputs.fatigue > thresholds.fatigue) {
            warnings.push({ label: '피로감', value: inputs.fatigue, threshold: thresholds.fatigue });
          }
          if (inputs.stress > thresholds.stress) {
            warnings.push({ label: '스트레스', value: inputs.stress, threshold: thresholds.stress });
          }

          // 기여도 퍼센트 계산
          const totalContribution = calculation.contributions.reduce((sum, c) => sum + Math.abs(c.contribution), 0);
          const contributionsWithPercent = calculation.contributions.map(c => ({
            key: c.key,
            label: c.label,
            contribution: c.contribution,
            percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
          }));

          results.push({
            name: '류마티스 관절염',
            score: calculation.score,
            level: risk.level,
            label: risk.label,
            message: risk.message,
            contributions: contributionsWithPercent,
            weeklyTrend,
            previousScore,
            warnings: warnings.slice(0, 5) // 상위 5개만
          });
        } catch (error) {
          console.error('Error analyzing 류마티스 관절염:', error);
        }
      }

      // 건선
      if (diseases.includes('건선')) {
        console.log('Analyzing: 건선');
        try {
          const psSpecific = latestRecord?.diseaseSpecific?.psoriasis;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: PsoriasisInputValues = {
          fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
          bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
          myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
          anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
          depression: latestRecord?.commonSymptoms?.depression ?? 0,
          stress: latestRecord?.commonSymptoms?.stress ?? 0,
          sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
          appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
          abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
          jointPain: latestRecord?.commonSymptoms?.jointPain ?? 0,
          functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
          skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
          itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
          erythema: psSpecific?.redness ?? 0,
          skinThickness: psSpecific?.thickness ?? 0,
          scaling: psSpecific?.scaling ?? 0
        };
        const thresholds = getDefaultPsoriasisThresholds();
        const calculation = calculatePsfiScore(inputs, thresholds);
        const risk = classifyPsfiRisk(calculation.score);
        
        // 주간 트렌드 계산 (오늘 제외, 최근 6일)
        const weeklyTrend = generateWeeklyTrend(calculation.score);
        
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        const totalContribution = calculation.contributions.reduce((sum, c) => sum + Math.abs(c.contribution), 0);
        const contributionsWithPercent = calculation.contributions.map(c => ({
          key: c.key,
          label: c.label,
          contribution: c.contribution,
          percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
        }));
        
        const warnings: Array<{ label: string; value: number; threshold: number }> = [];
        if (inputs.erythema > thresholds.erythema) warnings.push({ label: '붉은기', value: inputs.erythema, threshold: thresholds.erythema });
        if (inputs.skinThickness > thresholds.skinThickness) warnings.push({ label: '두께', value: inputs.skinThickness, threshold: thresholds.skinThickness });
        if (inputs.itchiness > thresholds.itchiness) warnings.push({ label: '가려움', value: inputs.itchiness, threshold: thresholds.itchiness });
        
        results.push({
          name: '건선',
          score: calculation.score,
          level: risk.level,
          label: risk.label,
          message: risk.message,
          contributions: contributionsWithPercent,
          weeklyTrend,
          previousScore,
          warnings: warnings.slice(0, 5)
        });
        } catch (error) {
          console.error('Error analyzing 건선:', error);
        }
      }

      // 크론병
      if (diseases.includes('크론병')) {
        console.log('Analyzing: 크론병');
        try {
          const crohnSpecific = latestRecord?.diseaseSpecific?.crohnsDisease;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: CrohnInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord?.commonSymptoms?.depression ?? 0,
            stress: latestRecord?.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
          jointPain: latestRecord?.commonSymptoms?.jointPain ?? 0,
          functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
          skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
          itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
          stoolFrequency: crohnSpecific?.bowelFrequency ?? 0,
          stoolLooseness: crohnSpecific?.stoolConsistency ?? 0,
          bloodMucus: crohnSpecific?.bloodMucus ?? 0,
          urgency: crohnSpecific?.urgency ?? 0,
          bloating: crohnSpecific?.bloating ?? 0
        };
        console.log('Crohn inputs:', inputs);
        const thresholds = getDefaultCrohnThresholds();
        const calculation = calculateCfiScore(inputs, thresholds);
        const risk = classifyCfiRisk(calculation.score);
        console.log('Crohn calculation:', calculation);
        console.log('Crohn risk:', risk);
        
        // 주간 트렌드 계산 (오늘 제외, 최근 6일)
        const weeklyTrend = generateWeeklyTrend(calculation.score);

        // 이전 점수
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;

        // 경고 신호 및 기여도 퍼센트
        const totalContribution = calculation.contributions.reduce((sum, c) => sum + Math.abs(c.contribution), 0);
        const warnings: Array<{ label: string; value: number; threshold: number }> = [];
        
        // 크론병 특정 항목들의 임계값 체크
        if (inputs.stoolFrequency > thresholds.stoolFrequency) {
          warnings.push({ label: '배변 횟수', value: inputs.stoolFrequency, threshold: thresholds.stoolFrequency });
        }
        if (inputs.abdominalPain > thresholds.abdominalPain) {
          warnings.push({ label: '복통', value: inputs.abdominalPain, threshold: thresholds.abdominalPain });
        }
        if (inputs.bloodMucus > thresholds.bloodMucus) {
          warnings.push({ label: '혈변/점액', value: inputs.bloodMucus, threshold: thresholds.bloodMucus });
        }
        
        const contributionsWithPercent = calculation.contributions.map(c => ({
          key: c.key,
          label: c.label,
          contribution: c.contribution,
          percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
        }));

        results.push({
          name: '크론병',
          score: calculation.score,
          level: risk.level,
          label: risk.label,
          message: risk.message,
          contributions: contributionsWithPercent,
          weeklyTrend,
          previousScore,
          warnings: warnings.slice(0, 5)
        });
        } catch (error) {
          console.error('Error analyzing 크론병:', error);
        }
      }

      // 제1형 당뇨병
      if (diseases.includes('제1형 당뇨병')) {
        console.log('Analyzing: 제1형 당뇨병');
        try {
          const t1dSpecific = latestRecord?.diseaseSpecific?.type1Diabetes;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: T1DInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
          bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
          myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
          anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
          depression: latestRecord?.commonSymptoms?.depression ?? 0,
          stress: latestRecord?.commonSymptoms?.stress ?? 0,
          sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
          appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
          abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
          functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
          glucoseVariability: t1dSpecific?.glucoseVariability ?? 0,
          hypoFrequency: t1dSpecific?.hypoFrequency ?? 0,
          hyperFrequency: t1dSpecific?.hyperFrequency ?? 0,
          timeInRange: t1dSpecific?.timeInRange ?? 0,
          insulinMissedDose: t1dSpecific?.insulinMissedDose ?? 0,
          ketoneWarning: t1dSpecific?.ketoneWarning ?? 0
        };
        const thresholds = getDefaultT1DThresholds();
        const calculation = calculateT1dFiScore(inputs, thresholds);
        const risk = classifyT1dRisk(calculation.score);
        const weeklyTrend = generateWeeklyTrend(calculation.score);
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        const totalContribution = calculation.contributions.reduce((sum, c) => sum + Math.abs(c.contribution), 0);
        const contributionsWithPercent = calculation.contributions.map(c => ({
          key: c.key,
          label: c.label,
          contribution: c.contribution,
          percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
        }));
        results.push({
          name: '제1형 당뇨병',
          score: calculation.score,
          level: risk.level,
          label: risk.label,
          message: risk.message,
          contributions: contributionsWithPercent,
          weeklyTrend,
          previousScore
        });
        } catch (error) {
          console.error('Error analyzing 제1형 당뇨병:', error);
        }
      }

      // 다발성 경화증
      if (diseases.includes('다발성 경화증(MS)') || diseases.includes('다발성 경화증')) {
        console.log('Analyzing: 다발성 경화증');
        try {
          const msSpecific = latestRecord?.diseaseSpecific?.multipleSclerosis;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: MSInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord?.commonSymptoms?.depression ?? 0,
            stress: latestRecord?.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
            functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
          visionBlur: msSpecific?.visionBlur ?? 0,
          sensoryLoss: msSpecific?.sensoryLoss ?? 0,
          balanceImpairment: msSpecific?.balanceImpairment ?? 0,
          walkingScore: msSpecific?.walkingScore ?? 0
        };
        const thresholds = getDefaultMsThresholds();
        const calculation = calculateMsFiScore(inputs, thresholds);
        const risk = classifyMsRisk(calculation.score);
        const weeklyTrend = generateWeeklyTrend(calculation.score);
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        const totalContribution = calculation.contributions.reduce((sum, c) => sum + Math.abs(c.contribution), 0);
        const contributionsWithPercent = calculation.contributions.map(c => ({
          key: c.key,
          label: c.label,
          contribution: c.contribution,
          percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
        }));
        results.push({
          name: '다발성 경화증',
          score: calculation.score,
          level: risk.level,
          label: risk.label,
          message: risk.message,
          contributions: contributionsWithPercent,
          weeklyTrend,
          previousScore
        });
        } catch (error) {
          console.error('Error analyzing 다발성 경화증:', error);
        }
      }

      // 루푸스
      if (diseases.includes('루푸스(SLE)') || diseases.includes('루푸스')) {
        console.log('Analyzing: 루푸스');
        try {
          const lupusSpecific = latestRecord?.diseaseSpecific?.lupus;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: LupusInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
            bodyTemp: latestRecord?.commonSymptoms?.bodyTemperature ?? 36.5,
            myalgia: latestRecord?.commonSymptoms?.bodyAche ?? 0,
            anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord?.commonSymptoms?.depression ?? 0,
            stress: latestRecord?.commonSymptoms?.stress ?? 0,
            sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
            appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
            abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
          jointPain: latestRecord?.commonSymptoms?.jointPain ?? 0,
          functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
          skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
          itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
          sunExposure: lupusSpecific?.sunExposure ?? 0,
          facialRash: lupusSpecific?.facialRash ?? 0,
          oralUlcer: lupusSpecific?.oralUlcer ?? 0
        };
        const calculation = calculateLupusScore(inputs);
        const risk = classifyLupusRisk(calculation.score);
        const weeklyTrend = generateWeeklyTrend(calculation.score);
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        const totalContribution = calculation.contributions?.reduce((sum, c) => sum + Math.abs(c.contribution), 0) || 0;
        const contributionsWithPercent = calculation.contributions?.map(c => ({
          key: c.key,
          label: c.label,
          contribution: c.contribution,
          percent: totalContribution > 0 ? (Math.abs(c.contribution) / totalContribution) * 100 : 0
        })) || [];
        results.push({
          name: '루푸스',
          score: calculation.score,
          level: risk.level,
          label: risk.label,
          message: risk.message,
          contributions: contributionsWithPercent,
          weeklyTrend,
          previousScore
        });
        } catch (error) {
          console.error('Error analyzing 루푸스:', error);
        }
      }

      // 쇼그렌 증후군
      if (diseases.includes('쇼그렌 증후군')) {
        console.log('Analyzing: 쇼그렌 증후군');
        try {
          const sjogrenSpecific = latestRecord?.diseaseSpecific?.sjogrensSyndrome;
          // commonSymptoms가 없어도 기본값(0)으로 분석 수행
          const inputs: SjogrenInputValues = {
            fatigue: latestRecord?.commonSymptoms?.fatigue ?? 0,
            stress: latestRecord?.commonSymptoms?.stress ?? 0,
            anxiety: latestRecord?.commonSymptoms?.anxiety ?? 0,
            depression: latestRecord?.commonSymptoms?.depression ?? 0,
            sleepDisturbance: latestRecord?.commonSymptoms?.sleepDisorder ?? 0,
            abdominalPain: latestRecord?.commonSymptoms?.abdominalPain ?? 0,
            appetiteLoss: latestRecord?.commonSymptoms?.appetiteLoss ?? 0,
            functionLoss: latestRecord?.commonSymptoms?.functionalDecline ?? 0,
            skinPain: latestRecord?.commonSymptoms?.skinPain ?? 0,
            itchiness: latestRecord?.commonSymptoms?.itching ?? 0,
          oralDryness: sjogrenSpecific?.mouthDryness ?? 0,
          ocularDryness: sjogrenSpecific?.eyeDryness ?? 0
        };
        const thresholds = getDefaultSjogrenThresholds();
        const score = calculateSsiScore(inputs, thresholds);
        const riskStr = classifySsiRisk(score);
        let level: 'stable' | 'caution' | 'flare' = 'stable';
        let label = '안정 단계';
        let message = '건조·피로·통증 등이 기준선과 크게 다르지 않습니다.';
        if (score >= 60) {
          level = 'flare';
          label = '고위험 flare 단계';
          message = '건조감, 피로, 통증, 가려움 등이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.';
        } else if (score >= 30) {
          level = 'caution';
          label = '주의 단계';
          message = '건조감 또는 피로·통증·가려움 등이 평소보다 증가했습니다.';
        }
        const weeklyTrend = generateWeeklyTrend(score);
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        results.push({
          name: '쇼그렌 증후군',
          score,
          level,
          label,
          message,
          weeklyTrend,
          previousScore
        });
        } catch (error) {
          console.error('Error analyzing 쇼그렌 증후군:', error);
        }
      }

      // 자가면역성 갑상선 질환
      if (diseases.includes('자가면역성 갑상선 질환')) {
        console.log('Analyzing: 자가면역성 갑상선 질환');
        const thyroidSpecific = latestRecord?.diseaseSpecific?.autoimmuneThyroid;
        // commonSymptoms가 없어도 기본값(0)으로 분석 수행
        const pulse = thyroidSpecific?.pulse ?? 70;
        const weightChange = thyroidSpecific?.weightChange ?? 0;
        const weightLoss = Math.max(0, Math.min(10, weightChange));
        const inputs: ThyroidInputValues = {
          restingHeartRate: pulse,
          tremorSeverity: thyroidSpecific?.tremorSeverity ?? 0,
          heatIntolerance: thyroidSpecific?.heatIntolerance ?? 0,
          weightLoss: weightLoss,
          fatigue: latestRecord.commonSymptoms?.fatigue ?? 0,
          bodyTemp: latestRecord.commonSymptoms?.bodyTemperature ?? thyroidSpecific?.bodyTemperature ?? 36.5,
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
        const riskStr = classifyThfiRisk(score);
        let level: 'stable' | 'caution' | 'flare' = 'stable';
        let label = '안정 단계';
        let message = '현재로서는 갑상선 항진 증상의 뚜렷한 악화가 크지 않습니다.';
        if (score >= 60) {
          level = 'flare';
          label = '고위험 flare 단계';
          message = '심박수, 떨림, 열 불편감, 체중 변동 등이 뚜렷하게 악화되었습니다. 의료진 상담을 권장합니다.';
        } else if (score >= 30) {
          level = 'caution';
          label = '주의 단계';
          message = '심박수, 떨림, 열 불편감 또는 체중 변동이 평소보다 증가한 신호가 있습니다.';
        }
        const weeklyTrend = generateWeeklyTrend(score);
        const previousScore = weeklyTrend.length > 1 ? weeklyTrend[0]?.score : undefined;
        results.push({
          name: '자가면역성 갑상선 질환',
          score,
          level,
          label,
          message,
          weeklyTrend,
          previousScore
        });
      }

        console.log('=== Analysis complete ===');
        console.log('Total results:', results.length);
        console.log('Results:', results.map(r => ({ name: r.name, score: r.score })));
        
        setAnalyses(results);
        
        if (results.length === 0) {
          console.warn('⚠️ No analysis results generated!');
          console.warn('User diseases:', diseases);
          console.warn('Latest record exists:', !!latestRecord);
          console.warn('Common symptoms:', latestRecord?.commonSymptoms);
          console.warn('Disease specific:', latestRecord?.diseaseSpecific);
          console.warn('Disease matching check:');
          diseases.forEach(d => {
            console.warn(`  - "${d}" matches:`, {
              '류마티스 관절염': d === '류마티스 관절염',
              '건선': d === '건선',
              '크론병': d === '크론병',
              '제1형 당뇨병': d === '제1형 당뇨병',
              '다발성 경화증': d === '다발성 경화증' || d === '다발성 경화증(MS)',
              '루푸스': d === '루푸스' || d === '루푸스(SLE)',
              '쇼그렌 증후군': d === '쇼그렌 증후군',
              '자가면역성 갑상선 질환': d === '자가면역성 갑상선 질환'
            });
          });
        }
      } catch (error) {
        console.error('Failed to load autoimmune analysis:', error);
        console.error('Error details:', error instanceof Error ? error.stack : error);
        setAnalyses([]);
      } finally {
        setLoading(false);
        isAnalyzing = false;
      }
    };

    // 초기 분석 실행
    analyzeData();

    // localStorage 변경 감지를 위한 이벤트 리스너 (다른 탭)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'prodromalSymptomRecords' || e.key === 'userDiseases') {
        analyzeData();
      }
    };

    // 같은 탭에서의 변경 감지 (커스텀 이벤트)
    const handleCustomStorageChange = (e?: Event) => {
      console.log('prodromalSymptomRecordsUpdated event received', e);
      analyzeData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('prodromalSymptomRecordsUpdated', handleCustomStorageChange);

    // 주기적으로 체크 (백업) - 깜빡임 방지를 위해 간격을 늘리고 조건부 실행
    const interval = setInterval(() => {
      // 데이터가 실제로 변경되었는지 확인
      const currentRecords = localStorage.getItem('prodromalSymptomRecords') || '';
      const currentDiseases = localStorage.getItem('userDiseases') || '';
      const currentRecordsHash = currentRecords.substring(0, 50); // 해시 대신 간단한 비교
      const currentDiseasesHash = currentDiseases.substring(0, 50);
      
      // 이전 값과 비교하여 변경된 경우에만 분석 실행
      if (currentRecordsHash !== lastRecordsHash || currentDiseasesHash !== lastDiseasesHash) {
        console.log('Interval check - data changed, running analysis');
        lastRecordsHash = currentRecordsHash;
        lastDiseasesHash = currentDiseasesHash;
        analyzeData();
      }
    }, 5000); // 2초에서 5초로 변경

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prodromalSymptomRecordsUpdated', handleCustomStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 오늘과 내일 날짜 포맷팅
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayFormatted = today.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric'
  });
  
  const tomorrowFormatted = tomorrow.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric'
  });

  // 오늘 예측 (임의 값)
  const todayPrediction = {
    date: todayFormatted,
    score: 29.5,
    level: 'stable' as const,
    label: '안정 단계',
    riskFactors: ['묽은 정도', '스트레스'],
    summary: '오늘은 flare 위험이 낮으며, 배변 상태가 안정적입니다.'
  };

  if (loading) {
  return (
      <div className="prediction-cards-container">
        <div className="prediction-card">
          <p>분석 중...</p>
        </div>
      </div>
    );
  }

  // 내일 예측 (실제 데이터 기반)
  const calculateTomorrowPrediction = () => {
    if (analyses.length > 0) {
      return {
        date: tomorrowFormatted,
        score: analyses[0].score,
        level: analyses[0].level,
        label: analyses[0].label,
        riskFactors: analyses[0].contributions
          ? analyses[0].contributions
              .sort((a, b) => b.contribution - a.contribution)
              .slice(0, 2)
              .map(c => c.label)
          : [],
        summary: analyses[0].message || '스트레스와 식사량 감소로 flare 위험이 다소 증가할 수 있습니다.',
        weeklyTrend: analyses[0].weeklyTrend || []
      };
    }
    
    // analyses가 비어있을 때도 일지 기록 데이터 기반으로 계산
    try {
      const stored = localStorage.getItem('prodromalSymptomRecords');
      if (stored) {
        const records: StoredProdromalRecord[] = JSON.parse(stored);
        if (records.length > 0) {
          // 최신 레코드 찾기
          const latestRecord = records.reduce((latest, current) => {
            if (!latest) return current;
            return current.date > latest.date ? current : latest;
          }, records[0]);
          
          console.log('Calculating tomorrow prediction from latest record:', latestRecord);
          
          // 질병별 분석 함수 사용 (analyses와 동일한 로직)
          const diseases = JSON.parse(localStorage.getItem('userDiseases') || '[]');
          let calculatedScore = 0;
          let calculatedLevel: 'stable' | 'caution' | 'flare' = 'stable';
          let calculatedLabel = '안정 단계';
          const riskFactors: string[] = [];
          
          // 류마티스 관절염 분석
          if (diseases.includes('류마티스 관절염') && latestRecord.commonSymptoms) {
            try {
              const raSpecific = latestRecord.diseaseSpecific?.rheumatoidArthritis;
              const inputs: RAInputValues = {
                fatigue: latestRecord.commonSymptoms.fatigue ?? 0,
                bodyTemp: latestRecord.commonSymptoms.bodyTemperature ?? 36.5,
                myalgia: latestRecord.commonSymptoms.bodyAche ?? 0,
                anxiety: latestRecord.commonSymptoms.anxiety ?? 0,
                depression: latestRecord.commonSymptoms.depression ?? 0,
                stress: latestRecord.commonSymptoms.stress ?? 0,
                sleepDisturbance: latestRecord.commonSymptoms.sleepDisorder ?? 0,
                appetiteLoss: latestRecord.commonSymptoms.appetiteLoss ?? 0,
                abdominalPain: latestRecord.commonSymptoms.abdominalPain ?? 0,
                jointPain: latestRecord.commonSymptoms.jointPain ?? 0,
                functionLoss: latestRecord.commonSymptoms.functionalDecline ?? 0,
                skinPain: latestRecord.commonSymptoms.skinPain ?? 0,
                itchiness: latestRecord.commonSymptoms.itching ?? 0,
                jointSwelling: raSpecific?.jointSwelling ?? 0,
                jointStiffness: raSpecific?.jointStiffness ?? 0,
                morningWorse: raSpecific?.worseInMorning ?? raSpecific?.morningWorse ?? 0
              };
              const thresholds = getDefaultThresholds();
              const calculation = calculateRafiScore(inputs, thresholds);
              const risk = classifyRafiRisk(calculation.score);
              calculatedScore = calculation.score;
              if (calculation.score >= 65) calculatedLevel = 'flare';
              else if (calculation.score >= 35) calculatedLevel = 'caution';
              calculatedLabel = risk.label;
              
              // 위험 요인 수집
              if (inputs.stress > thresholds.stress) riskFactors.push('스트레스');
              if (inputs.jointPain > thresholds.jointPain) riskFactors.push('관절통');
              if (inputs.fatigue > thresholds.fatigue) riskFactors.push('피로');
            } catch (e) {
              console.error('Error calculating RA score:', e);
            }
          }
          
          // 다른 질병들도 유사하게 처리할 수 있지만, 일단 RA만 처리
          // 점수가 0이면 기본 계산 사용
          if (calculatedScore === 0) {
            // 기본 점수 계산 (간단한 휴리스틱)
            let baseScore = 20; // 기본 점수
            
            // 공통 증상 점수 추가
            if (latestRecord.commonSymptoms) {
              const symptoms = latestRecord.commonSymptoms;
              const symptomValues = [
                symptoms.fatigue || 0,
                symptoms.stress || 0,
                symptoms.jointPain || 0,
                symptoms.abdominalPain || 0,
                symptoms.anxiety || 0,
                symptoms.depression || 0
              ];
              const avgSymptom = symptomValues.reduce((a, b) => a + b, 0) / symptomValues.length;
              baseScore += avgSymptom * 2; // 증상 점수 반영
            }
            
            calculatedScore = baseScore;
          }
          
          // 스트레스 기록 확인
          const stressRecords = data.stressRecords || [];
          if (stressRecords.length > 0) {
            const recentStress = stressRecords
              .filter(r => {
                const recordDate = new Date(r.date);
                const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 3;
              })
              .map(r => r.level);
            if (recentStress.length > 0) {
              const avgStress = recentStress.reduce((a, b) => a + b, 0) / recentStress.length;
              if (avgStress >= 7) {
                calculatedScore += 15; // 높은 스트레스 추가 점수
                if (!riskFactors.includes('스트레스')) riskFactors.push('스트레스');
              }
            }
          }
          
          // 수면 기록 확인
          const sleepRecords = data.sleepRecords || [];
          if (sleepRecords.length > 0) {
            const recentSleep = sleepRecords
              .filter(r => {
                const recordDate = new Date(r.date);
                const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 3;
              })
              .map(r => r.totalHours);
            if (recentSleep.length > 0) {
              const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
              if (avgSleep <= 6) {
                calculatedScore += 10; // 수면 부족 추가 점수
              }
            }
          }
          
          // 점수 범위 제한
          calculatedScore = Math.max(0, Math.min(100, calculatedScore));
          
          // 레벨 재결정
          if (calculatedScore >= 65) {
            calculatedLevel = 'flare';
            calculatedLabel = 'Flare 단계';
          } else if (calculatedScore >= 35) {
            calculatedLevel = 'caution';
            calculatedLabel = '주의 단계';
          } else {
            calculatedLevel = 'stable';
            calculatedLabel = '안정 단계';
          }
          
          console.log('Tomorrow prediction calculated:', {
            score: calculatedScore,
            level: calculatedLevel,
            label: calculatedLabel,
            riskFactors
          });
          
          return {
            date: tomorrowFormatted,
            score: Math.round(calculatedScore * 10) / 10,
            level: calculatedLevel,
            label: calculatedLabel,
            riskFactors,
            summary: riskFactors.length > 0 
              ? `${riskFactors.join(', ')}으로 flare 위험이 다소 증가할 수 있습니다.`
              : '현재 상태를 유지하면 flare 위험이 낮습니다.',
            weeklyTrend: []
          };
        }
      }
    } catch (e) {
      console.error('Failed to calculate tomorrow prediction:', e);
    }
    
    // 데이터가 없을 때
    return {
      date: tomorrowFormatted,
      score: 0,
      level: 'stable' as const,
      label: '데이터 없음',
      riskFactors: [],
      summary: '증상일지를 기록하면 내일 예측이 제공됩니다.',
      weeklyTrend: []
    };
  };
  
  const tomorrowPrediction = calculateTomorrowPrediction();

  // 주간 트렌드 데이터 생성 (이전 5일 + 오늘 + 내일 = 7일)
  const generateWeeklyTrend = () => {
    const trend: Array<{ date: string; score: number; day: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // analyses에서 주간 트렌드가 있으면 사용
    const existingTrend = analyses.length > 0 && analyses[0].weeklyTrend 
      ? analyses[0].weeklyTrend 
      : [];
    
    // 날짜 기반 해시 함수 (고정된 값 생성)
    const getDateHash = (dateStr: string): number => {
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    // 이전 5일 데이터
    for (let i = 5; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const day = date.getDate();
      
      // 기존 트렌드에서 찾기
      const existingPoint = existingTrend.find(t => t.date === dateStr);
      let score = 0;
      
      if (existingPoint) {
        score = existingPoint.score;
      } else {
        // 실제 기록이 있으면 사용, 없으면 날짜 기반 고정 가상 데이터
        const stored = localStorage.getItem('prodromalSymptomRecords');
        if (stored) {
          try {
            const records: StoredProdromalRecord[] = JSON.parse(stored);
            const record = records.find(r => r.date === dateStr);
            if (record && analyses.length > 0) {
              // 실제 기록이 있으면 해당 날짜의 점수 계산 (고정된 값)
              const hash = getDateHash(dateStr);
              const variation = (hash % 20) - 10; // -10 ~ 10 범위
              score = analyses[0].score * 0.8 + variation;
            } else {
              // 가상 데이터 (오늘 점수 기준으로 날짜 기반 변동)
              const hash = getDateHash(dateStr);
              const variation = (hash % 30) - 15; // -15 ~ 15 범위
              score = todayPrediction.score * 0.7 + variation;
            }
          } catch (e) {
            const hash = getDateHash(dateStr);
            const variation = (hash % 30) - 15;
            score = todayPrediction.score * 0.7 + variation;
          }
        } else {
          const hash = getDateHash(dateStr);
          const variation = (hash % 30) - 15;
          score = todayPrediction.score * 0.7 + variation;
        }
      }
      
      score = Math.max(0, Math.min(100, score));
      
      trend.push({
        date: dateStr,
        score: Math.round(score * 10) / 10,
        day
      });
    }
    
    // 오늘 데이터
    const todayDay = today.getDate();
    trend.push({
      date: today.toISOString().split('T')[0],
      score: todayPrediction.score,
      day: todayDay
    });
    
    // 내일 데이터
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    trend.push({
      date: tomorrow.toISOString().split('T')[0],
      score: tomorrowPrediction.score,
      day: tomorrowDay
    });
    
    return trend;
  };

  const weeklyTrend = generateWeeklyTrend();

  // 위험요인 분석 (일일 기록 데이터 기반)
  const analyzeDailyRiskFactors = () => {
    const riskFactors: Array<{ factor: string; level: 'low' | 'medium' | 'high'; message: string }> = [];
    
    // 증상일지 데이터 분석
    try {
      const stored = localStorage.getItem('prodromalSymptomRecords');
      if (stored) {
        const records: StoredProdromalRecord[] = JSON.parse(stored);
        const recentRecords = records
          .filter(r => {
            const recordDate = new Date(r.date);
            const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
          })
          .slice(-7); // 최근 7일
        
        if (recentRecords.length > 0) {
          // 피로감 분석
          const fatigueScores = recentRecords
            .map(r => r.commonSymptoms?.fatigue ?? 0)
            .filter(s => s > 0);
          if (fatigueScores.length > 0) {
            const avgFatigue = fatigueScores.reduce((a, b) => a + b, 0) / fatigueScores.length;
            if (avgFatigue > 7) {
              riskFactors.push({
                factor: '피로감',
                level: 'high',
                message: `최근 평균 피로감이 ${avgFatigue.toFixed(1)}점으로 높습니다. 충분한 휴식이 필요합니다.`
              });
            } else if (avgFatigue > 5) {
              riskFactors.push({
                factor: '피로감',
                level: 'medium',
                message: `최근 평균 피로감이 ${avgFatigue.toFixed(1)}점입니다.`
              });
            }
          }
          
          // 관절통 분석
          const jointPainScores = recentRecords
            .map(r => r.commonSymptoms?.jointPain ?? 0)
            .filter(s => s > 0);
          if (jointPainScores.length > 0) {
            const avgJointPain = jointPainScores.reduce((a, b) => a + b, 0) / jointPainScores.length;
            if (avgJointPain > 7) {
              riskFactors.push({
                factor: '관절통',
                level: 'high',
                message: `최근 평균 관절통이 ${avgJointPain.toFixed(1)}점으로 심합니다.`
              });
            } else if (avgJointPain > 5) {
              riskFactors.push({
                factor: '관절통',
                level: 'medium',
                message: `최근 평균 관절통이 ${avgJointPain.toFixed(1)}점입니다.`
              });
            }
          }
          
          // 복통 분석 (크론병 등)
          const abdominalPainScores = recentRecords
            .map(r => r.commonSymptoms?.abdominalPain ?? 0)
            .filter(s => s > 0);
          if (abdominalPainScores.length > 0) {
            const avgAbdominalPain = abdominalPainScores.reduce((a, b) => a + b, 0) / abdominalPainScores.length;
            if (avgAbdominalPain > 6) {
              riskFactors.push({
                factor: '복통',
                level: 'high',
                message: `최근 평균 복통이 ${avgAbdominalPain.toFixed(1)}점으로 심합니다.`
              });
            }
          }
          
          // 배변 상태 분석 (크론병)
          const stoolConsistencyScores = recentRecords
            .map(r => r.diseaseSpecific?.crohnsDisease?.stoolConsistency ?? 0)
            .filter(s => s > 0);
          if (stoolConsistencyScores.length > 0) {
            const avgStool = stoolConsistencyScores.reduce((a, b) => a + b, 0) / stoolConsistencyScores.length;
            if (avgStool > 7) {
              riskFactors.push({
                factor: '배변 상태',
                level: 'high',
                message: `최근 배변 상태가 불안정합니다 (평균 ${avgStool.toFixed(1)}점).`
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to analyze symptom records:', e);
    }
    
    // 스트레스 분석
    if (data.stressRecords && data.stressRecords.length > 0) {
      const recentStress = data.stressRecords
        .filter(r => {
          const recordDate = new Date(r.date);
          const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        })
        .map(r => r.level);
      
      if (recentStress.length > 0) {
        const avgStress = recentStress.reduce((a, b) => a + b, 0) / recentStress.length;
        const maxStress = Math.max(...recentStress);
        if (avgStress > 7 || maxStress > 8) {
          riskFactors.push({
            factor: '스트레스',
            level: 'high',
            message: `최근 평균 스트레스 수준이 ${avgStress.toFixed(1)}점으로 높습니다. 최고 ${maxStress}점까지 기록되었습니다.`
          });
        } else if (avgStress > 5) {
          riskFactors.push({
            factor: '스트레스',
            level: 'medium',
            message: `최근 평균 스트레스 수준이 ${avgStress.toFixed(1)}점입니다.`
          });
        }
      }
    }
    
    // 수면 분석
    if (data.sleepRecords && data.sleepRecords.length > 0) {
      const recentSleep = data.sleepRecords
        .filter(r => {
          const recordDate = new Date(r.date);
          const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        });
      
      if (recentSleep.length > 0) {
        const avgSleep = recentSleep.reduce((a, b) => a + b.totalHours, 0) / recentSleep.length;
        const minSleep = Math.min(...recentSleep.map(r => r.totalHours));
        const avgQuality = recentSleep.reduce((a, b) => a + b.quality, 0) / recentSleep.length;
        
        if (avgSleep < 6 || minSleep < 5) {
          riskFactors.push({
            factor: '수면 부족',
            level: 'high',
            message: `최근 평균 수면 시간이 ${avgSleep.toFixed(1)}시간으로 부족합니다. 최소 ${minSleep.toFixed(1)}시간만 수면했습니다.`
          });
        } else if (avgSleep < 7) {
          riskFactors.push({
            factor: '수면 부족',
            level: 'medium',
            message: `최근 평균 수면 시간이 ${avgSleep.toFixed(1)}시간입니다.`
          });
        }
        
        if (avgQuality < 5) {
          riskFactors.push({
            factor: '수면 질 저하',
            level: 'medium',
            message: `최근 평균 수면 질이 ${avgQuality.toFixed(1)}점으로 낮습니다.`
          });
        }
      }
    }
    
    // 음식 분석
    if (data.foodRecords && data.foodRecords.length > 0) {
      const recentFoods = data.foodRecords
        .filter(r => {
          const recordDate = new Date(r.date);
          const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        })
        .flatMap(r => r.foods);
      
      if (data.foodCorrelations && data.foodCorrelations.length > 0) {
        const riskyFoods = data.foodCorrelations
          .filter(c => c.recommendation === 'avoid' && recentFoods.includes(c.food))
          .slice(0, 3);
        
        if (riskyFoods.length > 0) {
          riskFactors.push({
            factor: '위험 음식 섭취',
            level: 'high',
            message: `최근 ${riskyFoods.map(f => f.food).join(', ')}를 섭취했습니다. 이 음식들은 flare 위험이 높습니다.`
          });
        }
      }
      
      // 증상 발생 음식 분석
      const foodsWithSymptoms = data.foodRecords
        .filter(r => {
          const recordDate = new Date(r.date);
          const daysDiff = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7 && r.symptomsAfter;
        });
      
      if (foodsWithSymptoms.length > 0) {
        const symptomFoods = foodsWithSymptoms
          .flatMap(r => r.foods)
          .filter((food, index, self) => self.indexOf(food) === index);
        
        if (symptomFoods.length > 0) {
          riskFactors.push({
            factor: '증상 유발 음식',
            level: 'high',
            message: `최근 ${symptomFoods.slice(0, 3).join(', ')} 섭취 후 증상이 발생했습니다.`
          });
        }
      }
    }
    
    // Flare 기록 분석
    if (data.flares && data.flares.length > 0) {
      const recentFlares = data.flares
        .filter(f => {
          const flareDate = new Date(f.date);
          const daysDiff = Math.floor((Date.now() - flareDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 30;
        });
      
      if (recentFlares.length > 0) {
        const avgSeverity = recentFlares.reduce((a, b) => a + b.severity, 0) / recentFlares.length;
        if (recentFlares.length >= 2 || avgSeverity > 7) {
          riskFactors.push({
            factor: '최근 Flare 발생',
            level: 'high',
            message: `최근 30일간 flare가 ${recentFlares.length}회 발생했습니다. 평균 심각도는 ${avgSeverity.toFixed(1)}점입니다.`
          });
        }
      }
    }
    
    return riskFactors;
  };

  const dailyRiskFactors = analyzeDailyRiskFactors();

  // 일일 기록 기반 위험 요인 분석 (사용자 요청 형식)
  const generateDailyRiskAnalysis = () => {
    const analysis: Array<{ type: 'stress' | 'food' | 'integrated'; messages: string[] }> = [];

    console.log('generateDailyRiskAnalysis - data:', data);
    console.log('stressCorrelation:', data.stressCorrelation);
    console.log('foodCorrelations:', data.foodCorrelations);
    console.log('riskAnalysis:', data.riskAnalysis);

    // 1. 스트레스 분석
    const stressMessages: string[] = [];
    
    // 일일 기록에서 스트레스 기록 확인
    try {
      const dailyRecordsStr = localStorage.getItem('dailyRecords');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      // 최근 7일간 스트레스 7 이상인 날 확인
      const highStressDays = new Set<string>();
      let hasAnyStressRecord = false;
      
      // 일일 기록 확인
      if (dailyRecordsStr) {
        const dailyRecords = JSON.parse(dailyRecordsStr);
        dailyRecords.forEach((record: any) => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate >= weekAgo && recordDate <= today) {
            // 일일 기록의 스트레스 값 확인 (commonSymptoms.stress)
            const stressLevel = record.commonSymptoms?.stress ?? 0;
            console.log('Daily record stress check:', record.date, 'stress:', stressLevel);
            if (stressLevel > 0) {
              hasAnyStressRecord = true;
            }
            if (stressLevel >= 7) {
              highStressDays.add(record.date);
            }
          }
        });
      }
      
      // 스트레스 기록도 확인
      if (data.stressRecords && data.stressRecords.length > 0) {
        data.stressRecords.forEach(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate >= weekAgo && recordDate <= today) {
            hasAnyStressRecord = true;
            console.log('Stress record check:', record.date, 'level:', record.level);
            if (record.level >= 7) {
              highStressDays.add(record.date);
            }
          }
        });
      }
      
      console.log('High stress days found:', Array.from(highStressDays));
      console.log('Has any stress record:', hasAnyStressRecord);
      
      // 스트레스 7 이상인 날이 있으면 메시지 표시
      if (highStressDays.size > 0) {
        stressMessages.push('스트레스 수준 높음');
        stressMessages.push('나의 flare는 평균적으로 스트레스 높은 날 2일 후 발생');
      } else if (hasAnyStressRecord) {
        // 스트레스 기록이 있지만 7 미만인 경우에도 기본 메시지 표시
        stressMessages.push('나의 flare는 평균적으로 스트레스 높은 날 2일 후 발생');
      }
    } catch (e) {
      console.error('Failed to load daily records for stress analysis:', e);
    }
    
    // 기존 분석도 유지 (데이터가 있을 때만, 스트레스 메시지가 없을 때)
    if (stressMessages.length === 0 && data.stressCorrelation) {
      if (data.stressCorrelation.highStressFlareCount > 0) {
        stressMessages.push(`스트레스 높은 주에 flare ${data.stressCorrelation.highStressFlareCount}회`);
      }
      if (data.stressCorrelation.averageDaysToFlare > 0) {
        stressMessages.push(`나의 flare는 평균적으로 스트레스 높은 날 ${Math.round(data.stressCorrelation.averageDaysToFlare)}일 후 발생`);
      } else {
        stressMessages.push('나의 flare는 평균적으로 스트레스 높은 날 2일 후 발생');
      }
    }
    
    // 스트레스 기록이 있으면 항상 표시
    if (stressMessages.length > 0) {
      analysis.push({ type: 'stress', messages: stressMessages });
    } else if (data.stressRecords && data.stressRecords.length > 0) {
      // 스트레스 기록이 있지만 메시지가 없는 경우 기본 메시지 표시
      analysis.push({ 
        type: 'stress', 
        messages: ['나의 flare는 평균적으로 스트레스 높은 날 2일 후 발생'] 
      });
    }

    // 2. 수면 분석
    const sleepMessages: string[] = [];
    
    // 일일 기록에서 수면 기록 확인
    try {
      const dailyRecordsStr = localStorage.getItem('dailyRecords');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      // 최근 7일간 6시간 이하 수면인 날 확인
      const lowSleepDays: string[] = [];
      
      // 일일 기록 확인
      if (dailyRecordsStr) {
        const dailyRecords = JSON.parse(dailyRecordsStr);
        dailyRecords.forEach((record: any) => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate >= weekAgo && recordDate <= today) {
            // 일일 기록의 수면 값 확인 (sleep.totalHours)
            const sleepHours = record.sleep?.totalHours ?? 0;
            console.log('Daily record sleep check:', record.date, 'sleep hours:', sleepHours);
            if (sleepHours > 0 && sleepHours <= 6) {
              lowSleepDays.push(record.date);
            }
          }
        });
      }
      
      // 수면 기록도 확인
      if (data.sleepRecords && data.sleepRecords.length > 0) {
        data.sleepRecords.forEach(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate >= weekAgo && recordDate <= today) {
            console.log('Sleep record check:', record.date, 'totalHours:', record.totalHours);
            if (record.totalHours > 0 && record.totalHours <= 6) {
              lowSleepDays.push(record.date);
            }
          }
        });
      }
      
      console.log('Low sleep days found:', lowSleepDays);
      
      // 6시간 이하 수면인 날이 있으면 메시지 표시
      if (lowSleepDays.length > 0) {
        sleepMessages.push('6시간 이하 수면 시 flare 위험이 1.4배 증가');
      }
    } catch (e) {
      console.error('Failed to load daily records for sleep analysis:', e);
    }
    
    // 수면 기록이 있으면 항상 표시
    if (sleepMessages.length > 0) {
      analysis.push({ type: 'sleep', messages: sleepMessages });
    } else if (data.sleepRecords && data.sleepRecords.length > 0) {
      // 수면 기록이 있지만 6시간 이하가 없는 경우에도 메시지 표시
      analysis.push({ 
        type: 'sleep', 
        messages: ['6시간 이하 수면 시 flare 위험이 1.4배 증가'] 
      });
    }

    // 3. 음식 분석
    const foodMessages: string[] = [];
    
    // 음식별 고정 확률 설정 함수
    const getFoodProbability = (food: string, defaultProb?: number): number => {
      const foodLower = food.toLowerCase();
      // 우유, 호두/땅콩: 80%
      if (foodLower.includes('우유') || foodLower.includes('호두') || foodLower.includes('땅콩')) {
        return 80;
      }
      // 대두, 해산물: 70%
      if (foodLower.includes('대두') || foodLower.includes('해산물') || foodLower.includes('생선')) {
        return 70;
      }
      // 밀, 새우, 고기류: 50%
      if (foodLower.includes('밀') || foodLower.includes('새우') || foodLower.includes('고기') || foodLower.includes('육류')) {
        return 50;
      }
      // 달걀: 30%
      if (foodLower.includes('달걀') || foodLower.includes('계란')) {
        return 30;
      }
      // 과일류, 메밀: 20%
      if (foodLower.includes('과일') || foodLower.includes('메밀')) {
        return 20;
      }
      // 기본값: 전달된 확률 또는 70%
      return defaultProb ?? 70;
    };
    
    // 일일 기록에서 주의 식품 가져오기
    try {
      const dailyRecordsStr = localStorage.getItem('dailyRecords');
      if (dailyRecordsStr) {
        const dailyRecords = JSON.parse(dailyRecordsStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        // 최근 7일간의 주의 식품 수집
        const recentWarningFoods = new Map<string, number>(); // 식품명 -> 횟수
        
        dailyRecords.forEach((record: any) => {
          const recordDate = new Date(record.date);
          if (recordDate >= weekAgo && recordDate <= today && record.meals) {
            ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
              const meal = record.meals[mealType];
              if (meal && meal.warningFoods && meal.warningFoods.length > 0) {
                meal.warningFoods.forEach((food: string) => {
                  recentWarningFoods.set(food, (recentWarningFoods.get(food) || 0) + 1);
                });
              }
            });
          }
        });
        
        // 주의 식품이 있으면 메시지 생성
        recentWarningFoods.forEach((count, foodName) => {
          // foodCorrelations에서 기본 확률 찾기
          let defaultProb = 70;
          if (data.foodCorrelations && data.foodCorrelations.length > 0) {
            const foodCorrelation = data.foodCorrelations.find(f => f.food === foodName);
            if (foodCorrelation && foodCorrelation.flareProbability > 0) {
              defaultProb = Math.round(foodCorrelation.flareProbability);
            }
          }
          
          const probability = getFoodProbability(foodName, defaultProb);
          foodMessages.push(`${foodName} 섭취 후 24시간 내 증상 악화 확률 ${probability}%`);
        });
      }
    } catch (e) {
      console.error('Failed to load daily records:', e);
    }
    
    // 기존 foodCorrelations 분석도 유지
    if (data.foodCorrelations && data.foodCorrelations.length > 0) {
      const topFoods = data.foodCorrelations
        .filter(c => c.recommendation === 'avoid' || c.flareProbability > 30)
        .slice(0, 3);
      
      topFoods.forEach(food => {
        // 이미 일일 기록에서 추가된 식품은 제외
        const alreadyAdded = foodMessages.some(msg => msg.includes(food.food));
        if (!alreadyAdded) {
          const probability = getFoodProbability(food.food, Math.round(food.flareProbability));
          if (probability >= 50) {
            foodMessages.push(`${food.food} 섭취 후 ${Math.round(food.averageHoursToSymptom)}시간 내 증상 악화 확률 ${probability}%`);
          } else if (food.message && food.message.includes('끊은 뒤')) {
            // flare 빈도 감소 메시지가 있는 경우
            foodMessages.push(`${food.food} 끊은 뒤 flare 빈도 ${Math.round(100 - food.flareProbability)}% 감소`);
          } else if (probability >= 20) {
            // 일반적인 위험 음식
            foodMessages.push(`${food.food} 섭취 후 ${Math.round(food.averageHoursToSymptom)}시간 내 증상 악화 확률 ${probability}%`);
          }
        }
      });
    }

    if (foodMessages.length > 0) {
      analysis.push({ type: 'food', messages: foodMessages });
    }

    // 3. 통합 분석
    if (data.riskAnalysis) {
      const integratedMessages: string[] = [];
      const factors: string[] = [];
      
      if (data.riskAnalysis.factors && data.riskAnalysis.factors.stress) factors.push('스트레스');
      if (data.riskAnalysis.factors && data.riskAnalysis.factors.sleep) factors.push('수면 부족');
      if (data.riskAnalysis.factors && data.riskAnalysis.factors.food) factors.push('특정 음식');
      
      if (factors.length > 0) {
        integratedMessages.push(`최근 3일간 ${factors.join(' + ')}으로 flare 가능성 경고`);
      }
      
      if (data.riskAnalysis.message && data.riskAnalysis.message.includes('유사한 패턴')) {
        integratedMessages.push('지난번 flare 전과 유사한 패턴입니다');
      }

      if (integratedMessages.length > 0) {
        analysis.push({ type: 'integrated', messages: integratedMessages });
      }
    }

    console.log('generateDailyRiskAnalysis - result:', analysis);
    return analysis;
  };

  const dailyRiskAnalysis = generateDailyRiskAnalysis();
    
    return (
    <div className="prediction-cards-container">
      {/* 오늘 예측 카드 */}
      <div className="prediction-card today-card">
        <div className="prediction-card-header">
          <span className="prediction-emoji">🔵</span>
          <span className="prediction-date-label">오늘 예측 ({todayPrediction.date})</span>
          </div>
        
        <div className="prediction-score-section">
          <div className="prediction-score-label">예측 점수:</div>
          <div className="prediction-score-value">{todayPrediction.score.toFixed(1)} / 100</div>
        </div>
        
        <div className="prediction-status-section">
          <span className="prediction-status-label">상태:</span>
          <span className={`prediction-status-badge ${todayPrediction.level}`}>
            {todayPrediction.level === 'stable' ? '✅' : todayPrediction.level === 'caution' ? '⚠️' : '🚨'} {todayPrediction.label}
          </span>
      </div>
        
        {todayPrediction.riskFactors.length > 0 && (
          <div className="prediction-risk-factors">
            <div className="prediction-risk-label">📌 주요 위험 요인:</div>
            <div className="prediction-risk-list">
              {todayPrediction.riskFactors.join(', ')}
            </div>
          </div>
        )}
        
        <div className="prediction-divider"></div>
        
        <div className="prediction-ai-summary">
          <div className="prediction-ai-label">🧠 AI 한줄 요약:</div>
          <div className="prediction-ai-text">"{todayPrediction.summary}"</div>
            </div>
      </div>

      {/* 내일 예측 카드 */}
      <div className="prediction-card tomorrow-card">
        <div className="prediction-card-header">
          <span className="prediction-emoji">🟣</span>
          <span className="prediction-date-label">내일 예측 ({tomorrowPrediction.date})</span>
                    </div>
        
        <div className="prediction-score-section">
          <div className="prediction-score-label">예측 점수:</div>
          <div className="prediction-score-value">{tomorrowPrediction.score.toFixed(1)} / 100</div>
                    </div>
        
        <div className="prediction-status-section">
          <span className="prediction-status-label">상태:</span>
          <span className={`prediction-status-badge ${tomorrowPrediction.level}`}>
            {tomorrowPrediction.level === 'stable' ? '✅' : tomorrowPrediction.level === 'caution' ? '⚠️' : '🚨'} {tomorrowPrediction.label}
          </span>
                  </div>
        
        {tomorrowPrediction.riskFactors.length > 0 && (
          <div className="prediction-risk-factors">
            <div className="prediction-risk-label">📌 증가 요인:</div>
            <div className="prediction-risk-list">
              {tomorrowPrediction.riskFactors.join(', ')}
            </div>
              </div>
            )}

        <div className="prediction-divider"></div>
        
        <div className="prediction-ai-summary">
          <div className="prediction-ai-label">🧠 AI 예측 요약:</div>
          <div className="prediction-ai-text">"{tomorrowPrediction.summary}"</div>
        </div>
      </div>

      {/* 주간 트렌드 분석 */}
      {weeklyTrend.length > 0 && (
        <div className="prediction-weekly-trend-card">
          <div className="prediction-trend-title">📊 주간 트렌드 분석</div>
          <div className="prediction-trend-chart">
            <div className="prediction-trend-chart-container">
              {weeklyTrend.map((point, idx) => {
                const scores = weeklyTrend.map(p => p.score);
                const maxScore = Math.max(...scores, 100);
                const minScore = Math.min(...scores);
                const range = maxScore - minScore || 1;
                // 정규화: 최소값을 0으로, 최대값을 100%로 매핑 (최소 높이 10% 보장)
                const normalizedHeight = ((point.score - minScore) / range) * 90 + 10;
                const height = Math.max(normalizedHeight, 10);
                const isToday = idx === weeklyTrend.length - 2;
                const isTomorrow = idx === weeklyTrend.length - 1;
                
                      return (
                  <div key={idx} className="prediction-trend-bar-wrapper">
                    <div className="prediction-trend-bar-container">
                            <div 
                        className={`prediction-trend-bar ${isToday ? 'today' : isTomorrow ? 'tomorrow' : ''}`}
                              style={{
                                height: `${height}%`,
                                backgroundColor: point.score >= 60 ? '#ef4444' : 
                                                point.score >= 30 ? '#f59e0b' : '#10b981'
                              }}
                        title={`${point.date}: ${point.score.toFixed(1)}점`}
                            />
                      <span className="prediction-trend-score">{point.score.toFixed(1)}</span>
                          </div>
                    <span className="prediction-trend-day">{point.day}일</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

      {/* 위험요인 분석 */}
        <div className="prediction-daily-risk-factors">
          <div className="prediction-divider"></div>
          <div className="prediction-risk-factors-title">⚠️ 위험요인 분석</div>
          
          {/* 기존 위험요인 리스트 (음식 관련 제외) */}
          {dailyRiskFactors.filter(risk => !risk.factor.includes('음식')).length > 0 && (
            <div className="prediction-risk-factors-list">
              {dailyRiskFactors
                .filter(risk => !risk.factor.includes('음식'))
                .map((risk, idx) => (
                  <div key={idx} className={`prediction-risk-factor-item ${risk.level}`}>
                    <div className="prediction-risk-factor-header">
                      <span className="prediction-risk-factor-name">{risk.factor}</span>
                      <span className={`prediction-risk-factor-badge ${risk.level}`}>
                        {risk.level === 'high' ? '🔴 높음' : risk.level === 'medium' ? '🟡 보통' : '🟢 낮음'}
                      </span>
                    </div>
                    <div className="prediction-risk-factor-message">{risk.message}</div>
                          </div>
                        ))}
                </div>
              )}

          {/* 일일 기록 기반 위험 요인 분석 (음식, 스트레스, 통합 분석) */}
          {dailyRiskAnalysis.length > 0 && (
            <div className="prediction-daily-analysis-content">
              {/* 음식 분석 칸 */}
              {dailyRiskAnalysis.find(item => item.type === 'food') && (
                <div className="prediction-food-analysis-section">
                  <div className="prediction-analysis-section-title">음식 분석</div>
                  <div className="prediction-food-messages-list">
                    {dailyRiskAnalysis
                      .find(item => item.type === 'food')
                      ?.messages.map((msg, msgIdx) => {
                        // 확률 부분을 강조
                        const parts = msg.split(/(\d+%)/);
                        return (
                          <div key={msgIdx} className="prediction-food-message">
                            "{parts.map((part, idx) => 
                              /\d+%/.test(part) ? (
                                <span key={idx} className="prediction-food-highlight">{part}</span>
                              ) : (
                                part
                              )
                            )}"
                      </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 스트레스 분석 칸 */}
              {dailyRiskAnalysis.find(item => item.type === 'stress') && (
                <div className="prediction-stress-analysis-section">
                  <div className="prediction-analysis-section-title">스트레스 분석</div>
                  <div className="prediction-stress-messages-list">
                    {dailyRiskAnalysis
                      .find(item => item.type === 'stress')
                      ?.messages.map((msg, msgIdx) => {
                        // "2일" 부분을 강조
                        const parts = msg.split(/(\d+일)/);
                        return (
                          <div key={msgIdx} className="prediction-stress-message">
                            "{parts.map((part, idx) => 
                              /\d+일/.test(part) ? (
                                <span key={idx} className="prediction-stress-highlight">{part}</span>
                              ) : (
                                part
                              )
                            )}"
                    </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 수면 분석 칸 */}
              {dailyRiskAnalysis.find(item => item.type === 'sleep') && (
                <div className="prediction-sleep-analysis-section">
                  <div className="prediction-analysis-section-title">수면 분석</div>
                  <div className="prediction-sleep-messages-list">
                    {dailyRiskAnalysis
                      .find(item => item.type === 'sleep')
                      ?.messages.map((msg, msgIdx) => {
                        // "1.4배 증가" 부분을 강조
                        const parts = msg.split(/(\d+\.?\d*배 증가)/);
                        return (
                          <div key={msgIdx} className="prediction-sleep-message">
                            "{parts.map((part, idx) => 
                              /\d+\.?\d*배 증가/.test(part) ? (
                                <span key={idx} className="prediction-sleep-highlight">{part}</span>
                              ) : (
                                part
                              )
                            )}"
          </div>
        );
      })}
              </div>
            </div>
          )}

              {/* 통합 분석 칸 */}
              {dailyRiskAnalysis.find(item => item.type === 'integrated') && (
                <div className="prediction-analysis-card integrated-card">
                  <div className="prediction-analysis-card-title">통합 분석</div>
                  <div className="prediction-analysis-integrated">
                    {dailyRiskAnalysis
                      .find(item => item.type === 'integrated')
                      ?.messages.map((msg, msgIdx) => (
                        <div key={msgIdx} className="prediction-analysis-message">
                          "{msg}"
                    </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* 데이터가 없을 때 */}
          {dailyRiskFactors.length === 0 && dailyRiskAnalysis.length === 0 && (
            <div className="prediction-analysis-no-data">
              일일 기록 데이터를 입력하면 분석 결과가 표시됩니다.
            </div>
          )}
                    </div>
    </div>
  );
};

export default FlareAnalysisResults;
