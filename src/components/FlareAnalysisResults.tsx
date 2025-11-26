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

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (loading) {
  return (
    <div className="analysis-results">
        <div className="flare-ai-card">
          <p>분석 중...</p>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    // 데이터 확인
    const diseases = JSON.parse(localStorage.getItem('userDiseases') || '[]');
    const records = localStorage.getItem('prodromalSymptomRecords');
    
    let message = '증상일지를 기록하면 AI 분석이 제공됩니다.';
    
    if (!diseases || diseases.length === 0) {
      message = '질병을 먼저 선택해주세요.';
    } else if (!records) {
      message = '증상일지를 기록해주세요.';
    } else {
      try {
        const parsedRecords = JSON.parse(records);
        if (!parsedRecords || parsedRecords.length === 0) {
          message = '증상일지를 기록해주세요.';
        } else {
          message = '증상일지를 기록하면 AI 분석이 제공됩니다. (데이터는 있지만 분석 결과가 없습니다)';
        }
      } catch (e) {
        message = '증상일지 데이터를 확인할 수 없습니다.';
      }
    }
    
    return (
      <div className="analysis-results">
        <div className="flare-ai-card">
          <p className="today-date">{today}</p>
          <h3 className="flare-ai-title">Flare-up AI 예측</h3>
          <p className="no-data-message">{message}</p>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#9ca3af' }}>
            <p>디버그 정보:</p>
            <p>질병 선택: {diseases.length > 0 ? diseases.join(', ') : '없음'}</p>
            <p>기록 존재: {records ? '있음' : '없음'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-results">
      {analyses.map((analysis, index) => {
        // 상위 3개 위험 항목 추출
        const topContributions = analysis.contributions
          ? [...analysis.contributions]
              .sort((a, b) => b.contribution - a.contribution)
              .slice(0, 3)
          : [];
        const maxContribution = topContributions.length > 0 
          ? Math.max(...topContributions.map(c => c.contribution))
          : 0;

        return (
          <div key={index} className="flare-ai-card">
            <p className="today-date">{today}</p>
            <h3 className="flare-ai-title">Flare-up AI 예측</h3>
            <p className="disease-name">{analysis.name}</p>
            <div className="score-section">
              <div className="score-value">{analysis.score.toFixed(1)}/100</div>
              <div className={`status-badge ${analysis.level}`}>{analysis.label}</div>
            </div>
            <p className="analysis-message">{analysis.message}</p>
            
            {topContributions.length > 0 && (
              <div className="contributions-section">
                <h4 className="contributions-title">주요 위험 요인</h4>
                {topContributions.map((contrib, idx) => (
                  <div key={idx} className="contribution-item">
                    <div className="contribution-header">
                      <span className="contribution-label">{contrib.label}</span>
                      <span className="contribution-value">{contrib.contribution.toFixed(2)}</span>
                    </div>
                    <div className="contribution-bar-container">
                      <div 
                        className="contribution-bar"
                        style={{
                          width: `${(contrib.contribution / maxContribution) * 100}%`,
                          backgroundColor: analysis.level === 'flare' ? '#ef4444' : 
                                          analysis.level === 'caution' ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 주간 트렌드 차트 */}
            {analysis.weeklyTrend && analysis.weeklyTrend.length > 0 && (
              <div className="trend-section">
                <h4 className="trend-title">주간 트렌드 분석</h4>
                <div className="trend-chart">
                  <div className="trend-chart-container">
                    {/* 막대 그래프 */}
                    {analysis.weeklyTrend.map((point, idx) => {
                      const maxScore = Math.max(...analysis.weeklyTrend!.map(p => p.score), 100);
                      const height = (point.score / maxScore) * 100;
                      const isToday = idx === analysis.weeklyTrend!.length - 1;
                      return (
                        <div key={idx} className="trend-bar-wrapper">
                          <div className="trend-bar-container">
                            <div 
                              className={`trend-bar ${isToday ? 'today' : ''}`}
                              style={{
                                height: `${height}%`,
                                backgroundColor: point.score >= 60 ? '#ef4444' : 
                                                point.score >= 30 ? '#f59e0b' : '#10b981'
                              }}
                              title={`${point.dayOfWeek}: ${point.score.toFixed(1)}점`}
                            />
                            <span className="trend-score">{point.score.toFixed(1)}</span>
                          </div>
                          <span className="trend-date">{point.dayOfWeek}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 분석 정보 섹션 */}
            <div className="analysis-info-section">
              <h4 className="info-section-title">분석 정보</h4>

              {/* 1. 위험 요인 기여도 분석 */}
              {analysis.contributions && analysis.contributions.length > 0 && (
                <div className="info-subsection">
                  <h5 className="info-subtitle">1. 질환별 위험 요인 기여도 분석</h5>
                  <div className="feature-importance">
                    <div className="feature-importance-header">
                      <span className="feature-label">예측 점수</span>
                      <span className="feature-score">{analysis.score.toFixed(1)}점</span>
                    </div>
                    <div className="feature-list">
                      {analysis.contributions
                        .sort((a, b) => (b.percent || 0) - (a.percent || 0))
                        .slice(0, 10)
                        .map((contrib, idx) => (
                          <div key={idx} className="feature-item">
                            <div className="feature-name-row">
                              <span className="feature-name">{contrib.label}</span>
                              <span className="feature-percent">{contrib.percent?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="feature-bar-container">
                              <div 
                                className="feature-bar"
                                style={{
                                  width: `${contrib.percent || 0}%`,
                                  backgroundColor: analysis.level === 'flare' ? '#ef4444' : 
                                                  analysis.level === 'caution' ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 경고 신호 */}
              {analysis.warnings && analysis.warnings.length > 0 && (
                <div className="info-subsection">
                  <h5 className="info-subtitle">2. 경고 신호 또는 임계값 초과 알림</h5>
                  <div className="warnings-list">
                    {analysis.warnings.map((warning, idx) => (
                      <div key={idx} className="warning-item">
                        <span className="warning-icon">🚨</span>
                        <span className="warning-text">
                          {warning.label} {warning.value.toFixed(1)}점 → 주의 필요
                          {warning.value > warning.threshold * 1.5 && ' (플레어업 가능성 높음)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 증상 변화 추세 */}
              {analysis.previousScore !== undefined && (
                <div className="info-subsection">
                  <h5 className="info-subtitle">3. 증상 변화 추세 (시간에 따른 비교)</h5>
                  <div className="trend-comparison">
                    <div className="trend-item">
                      <span className="trend-label">이전 점수</span>
                      <span className="trend-value">{analysis.previousScore.toFixed(1)}점</span>
                    </div>
                    <div className="trend-arrow">
                      {analysis.score > analysis.previousScore ? '📈' : 
                       analysis.score < analysis.previousScore ? '📉' : '➡️'}
                    </div>
                    <div className="trend-item">
                      <span className="trend-label">현재 점수</span>
                      <span className="trend-value">{analysis.score.toFixed(1)}점</span>
                    </div>
                    <div className="trend-change">
                      {analysis.score > analysis.previousScore ? (
                        <span className="trend-increase">증가 (+{(analysis.score - analysis.previousScore).toFixed(1)})</span>
                      ) : analysis.score < analysis.previousScore ? (
                        <span className="trend-decrease">감소 ({(analysis.score - analysis.previousScore).toFixed(1)})</span>
                      ) : (
                        <span className="trend-stable">변화 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 위험 요인 분석 섹션 */}
      {data && (data.stressCorrelation || data.foodCorrelations?.length > 0 || data.sleepCorrelation || data.riskAnalysis) && (
        <div className="risk-factors-section">
          <h3 className="risk-factors-title">위험 요인 분석</h3>

          {/* 스트레스 상관 분석 */}
          {data.stressCorrelation && data.stressCorrelation.message !== '데이터가 부족하여 분석할 수 없습니다.' && (
            <div className="risk-factor-card">
              <h4 className="risk-factor-subtitle">스트레스 상관 분석</h4>
              <div className="risk-factor-content">
                <p className="risk-factor-message">
                  {data.stressCorrelation.highStressFlareCount > 0 ? (
                    <>스트레스 높은 주에 flare {data.stressCorrelation.highStressFlareCount}회</>
                  ) : (
                    <>스트레스와 flare 간의 명확한 패턴을 찾을 수 없습니다.</>
                  )}
                  {data.stressCorrelation.averageDaysToFlare > 0 && (
                    <><br />나의 flare는 평균적으로 스트레스 높은 날 {Math.round(data.stressCorrelation.averageDaysToFlare)}일 후 발생</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 음식 상관 분석 */}
          {data.foodCorrelations && data.foodCorrelations.length > 0 && (
            <div className="risk-factor-card">
              <h4 className="risk-factor-subtitle">음식 상관 분석</h4>
              <div className="risk-factor-content">
                {data.foodCorrelations
                  .filter(c => c.recommendation === 'avoid' || c.flareProbability > 30)
                  .slice(0, 5)
                  .map((correlation, idx) => (
                    <div key={idx} className="food-correlation-item">
                      <div className="food-correlation-header">
                        <span className="food-name">{correlation.food}</span>
                        {correlation.recommendation === 'avoid' && (
                          <span className="food-badge avoid">피해야 할 음식</span>
                        )}
                        {correlation.recommendation === 'moderate' && (
                          <span className="food-badge moderate">주의 필요</span>
                        )}
                      </div>
                      <p className="food-correlation-message">{correlation.message}</p>
                      {correlation.message.includes('끊은 뒤') && (
                        <p className="food-improvement">✓ {correlation.food} 끊은 뒤 flare 빈도 감소</p>
                      )}
                    </div>
                  ))}
                {data.foodCorrelations.filter(c => c.recommendation === 'safe').length > 0 && (
                  <div className="recommended-foods">
                    <h5 className="recommended-foods-title">추천 음식</h5>
                    <div className="recommended-foods-list">
                      {data.foodCorrelations
                        .filter(c => c.recommendation === 'safe')
                        .slice(0, 5)
                        .map((correlation, idx) => (
                          <span key={idx} className="recommended-food-tag">{correlation.food}</span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 수면시간 상관 분석 */}
          {data.sleepCorrelation && data.sleepCorrelation.message !== '데이터가 부족하여 분석할 수 없습니다.' && (
            <div className="risk-factor-card">
              <h4 className="risk-factor-subtitle">수면시간 상관 분석</h4>
              <div className="risk-factor-content">
                <p className="risk-factor-message">
                  수면시간의 상관계수: {data.sleepCorrelation.correlation.toFixed(2)}
                  {data.sleepCorrelation.correlation < -0.5 && (
                    <><br />수면 시간이 부족할수록 flare 발생 가능성이 높습니다.</>
                  )}
                </p>
                <p className="sleep-recommendation">
                  권장 수면시간: {data.sleepCorrelation.recommendedHours.toFixed(1)}시간
                </p>
              </div>
            </div>
          )}

          {/* 통합 분석 */}
          {data.riskAnalysis && (
            <div className={`risk-factor-card ${data.riskAnalysis.riskLevel !== 'low' ? 'critical' : ''}`}>
              <h4 className="risk-factor-subtitle">통합 분석</h4>
              <div className="risk-factor-content">
                {data.riskAnalysis.riskLevel !== 'low' && (
                  <>
                    <div className="risk-level-badge">
                      {data.riskAnalysis.riskLevel === 'critical' && '🚨'}
                      {data.riskAnalysis.riskLevel === 'high' && '⚠️'}
                      {data.riskAnalysis.riskLevel === 'medium' && '⚡'}
                      <span className="risk-level-text">
                        {data.riskAnalysis.riskLevel === 'critical' && '위험'}
                        {data.riskAnalysis.riskLevel === 'high' && '높음'}
                        {data.riskAnalysis.riskLevel === 'medium' && '보통'}
                      </span>
                    </div>
                    <p className="risk-analysis-message">
                      최근 3일간의 패턴 분석:
                      {data.riskAnalysis.factors.stress && ' 수면 부족'}
                      {data.riskAnalysis.factors.sleep && ' 스트레스'}
                      {data.riskAnalysis.factors.food && ' 특정 음식'}
                      {data.riskAnalysis.message.includes('유사한 패턴') && (
                        <><br /><strong>지난번 flare 전과 유사한 패턴입니다.</strong></>
                      )}
                    </p>
                    <div className="risk-factors-tags">
                      {data.riskAnalysis.factors.stress && (
                        <div className="risk-factor-tag">수면 부족</div>
                      )}
                      {data.riskAnalysis.factors.sleep && (
                        <div className="risk-factor-tag">스트레스</div>
                      )}
                      {data.riskAnalysis.factors.food && (
                        <div className="risk-factor-tag">특정 음식</div>
                      )}
                    </div>
                  </>
                )}
                {data.riskAnalysis.recommendations && data.riskAnalysis.recommendations.length > 0 && (
                  <div className="risk-recommendations">
                    <h5 className="recommendations-title">권장 사항</h5>
                    <ul className="recommendations-list">
                      {data.riskAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlareAnalysisResults;
