export type HRVStatus = 'LOW' | 'UNBALANCED' | 'BALANCED' | 'HIGH';

export interface HRVData {
  date: string;
  lastNightMs: number;
  baselineLow: number;
  baselineHigh: number;
  status: HRVStatus;
}

export interface SleepData {
  date: string;
  score: number;
  durationSeconds: number;
  deepSeconds: number;
  remSeconds: number;
  lightSeconds: number;
  awakeSeconds: number;
}

export interface BodyBatteryData {
  date: string;
  charged: number;
  drained: number;
  highest: number;
  lowest: number;
}

export interface DailyWellness {
  id: string;
  userId: string;
  date: string;
  // HRV
  hrvLastNightMs?: number;
  hrvBaselineLow?: number;
  hrvBaselineHigh?: number;
  hrvStatus?: HRVStatus;
  // Sleep
  sleepScore?: number;
  sleepDurationSeconds?: number;
  sleepDeepSeconds?: number;
  sleepRemSeconds?: number;
  sleepLightSeconds?: number;
  sleepAwakeSeconds?: number;
  // Body Battery
  bodyBatteryCharged?: number;
  bodyBatteryDrained?: number;
  bodyBatteryHighest?: number;
  bodyBatteryLowest?: number;
  // Stress
  avgStressLevel?: number;
  maxStressLevel?: number;
  restStressDurationSeconds?: number;
  // Respiration
  avgWakingRespirationValue?: number;
  avgSpo2Value?: number;
  // Readiness
  trainingReadinessScore?: number;
  trainingReadinessDescription?: string;
  // Steps
  totalSteps?: number;
  dailyStepGoal?: number;
  // HR
  restingHR?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryMetrics {
  readinessScore: number;
  readinessFactors: ReadinessFactor[];
  hrvStatus: HRVStatus;
  hrvValue: number;
  bodyBattery: number;
  sleepScore: number;
  recommendation: string;
}

export interface ReadinessFactor {
  name: string;
  score: number;
  label: string;
  color: string;
}
