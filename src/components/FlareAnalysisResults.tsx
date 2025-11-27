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
    const analyzeData = () => {
      console.log('Starting analysis...');
      setLoading(true);
      
      try {
        const diseases = JSON.parse(localStorage.getItem('userDiseases') || '[]');
        console.log('User diseases:', diseases);
        if (!Array.isArray(diseases) || diseases.length === 0) {
          console.log('No diseases selected');
          setAnalyses([]);
          setLoading(false);
          return;
        }

        const stored = localStorage.getItem('prodromalSymptomRecords');
        console.log('Stored records:', stored);
        if (!stored) {
          console.log('No stored records');
          setAnalyses([]);
          setLoading(false);
          return;
        }

        const records: StoredProdromalRecord[] = JSON.parse(stored);
        console.log('Parsed records:', records);
        if (!Array.isArray(records) || records.length === 0) {
          console.log('Records array is empty');
          setAnalyses([]);
          setLoading(false);
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

    // 주기적으로 체크 (백업) - 더 자주 체크하여 빠른 반응
    const interval = setInterval(() => {
      console.log('Interval check - running analysis');
      analyzeData();
    }, 2000);

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
  const tomorrowPrediction = analyses.length > 0 ? {
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
  } : {
    date: tomorrowFormatted,
    score: 0,
    level: 'stable' as const,
    label: '데이터 없음',
    riskFactors: [],
    summary: '증상일지를 기록하면 내일 예측이 제공됩니다.',
    weeklyTrend: []
  };

  // 주간 트렌드 데이터 생성 (이전 5일 + 오늘 + 내일 = 7일)
  const generateWeeklyTrend = () => {
    const trend: Array<{ date: string; score: number; day: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // analyses에서 주간 트렌드가 있으면 사용
    const existingTrend = analyses.length > 0 && analyses[0].weeklyTrend 
      ? analyses[0].weeklyTrend 
      : [];
    
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
        // 실제 기록이 있으면 사용, 없으면 가상 데이터
        const stored = localStorage.getItem('prodromalSymptomRecords');
        if (stored) {
          try {
            const records: StoredProdromalRecord[] = JSON.parse(stored);
            const record = records.find(r => r.date === dateStr);
            if (record && analyses.length > 0) {
              // 실제 기록이 있으면 해당 날짜의 점수 계산
              score = analyses[0].score * 0.8 + (Math.random() * 10 - 5);
            } else {
              // 가상 데이터 (오늘 점수 기준으로 변동)
              score = todayPrediction.score * 0.7 + (Math.random() * 15 - 7.5);
            }
          } catch (e) {
            score = todayPrediction.score * 0.7 + (Math.random() * 15 - 7.5);
          }
        } else {
          score = todayPrediction.score * 0.7 + (Math.random() * 15 - 7.5);
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

        {/* 주간 트렌드 분석 */}
        {weeklyTrend.length > 0 && (
          <div className="prediction-weekly-trend">
            <div className="prediction-divider"></div>
            <div className="prediction-trend-title">📊 주간 트렌드 분석</div>
            <div className="prediction-trend-chart">
              <div className="prediction-trend-chart-container">
                {weeklyTrend.map((point, idx) => {
                  const maxScore = Math.max(...weeklyTrend.map(p => p.score), 100);
                  const height = (point.score / maxScore) * 100;
                  const isToday = idx === weeklyTrend.length - 2;
                  const isTomorrow = idx === weeklyTrend.length - 1;
                  
                  return (
                    <div key={idx} className="prediction-trend-bar-wrapper">
                      <div className="prediction-trend-bar-container">
                        <div 
                          className={`prediction-trend-bar ${isToday ? 'today' : isTomorrow ? 'tomorrow' : ''}`}
                          style={{
                            height: `${Math.max(height, 5)}%`,
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
        {dailyRiskFactors.length > 0 && (
          <div className="prediction-daily-risk-factors">
            <div className="prediction-divider"></div>
            <div className="prediction-risk-factors-title">⚠️ 일일 기록 기반 위험요인 분석</div>
            <div className="prediction-risk-factors-list">
              {dailyRiskFactors.map((risk, idx) => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FlareAnalysisResults;
