export interface Split {
  splitNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number;
  avgHR: number;
  maxHR: number;
  elevationGain: number;
  cadence: number;
}

export interface RunDynamics {
  avgCadence: number;
  avgStrideLength: number; // cm
  avgVerticalOscillation: number; // cm
  avgGroundContactTime: number; // ms
  avgVerticalRatio: number; // %
  avgGroundContactBalance: number; // % (left/right)
}

export interface HRZoneDistribution {
  zone1Seconds: number;
  zone2Seconds: number;
  zone3Seconds: number;
  zone4Seconds: number;
  zone5Seconds: number;
  zone1Percent: number;
  zone2Percent: number;
  zone3Percent: number;
  zone4Percent: number;
  zone5Percent: number;
}

export interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  label: string;
  minHR: number;
  maxHR: number;
  color: string;
  seconds: number;
  percent: number;
}

export interface Activity {
  id: string;
  userId: string;
  garminActivityId?: number;
  name: string;
  activityType: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  bestPaceSecondsPerKm?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  maxElevationMeters?: number;
  avgHR?: number;
  maxHR?: number;
  calories?: number;
  trainingEffectAerobic?: number;
  trainingEffectAnaerobic?: number;
  trainingLoad?: number;
  vo2maxEstimate?: number;
  lactateThresholdHR?: number;
  avgCadence?: number;
  avgStrideLength?: number;
  avgVerticalOscillation?: number;
  avgGroundContactTime?: number;
  avgVerticalRatio?: number;
  avgGroundContactBalance?: number;
  splits: Split[];
  hrZones: HRZoneDistribution;
  temperatureCelsius?: number;
  weatherCondition?: string;
  isAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityListItem {
  id: string;
  name: string;
  activityType: string;
  startTime: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  avgHR?: number;
  elevationGainMeters?: number;
  trainingEffectAerobic?: number;
  trainingLoad?: number;
  isAnalyzed: boolean;
  coachVerdict?: string;
}

export type TrainingEffectLabel =
  | 'Recovery'
  | 'Base'
  | 'Improving Aerobic Fitness'
  | 'Highly Aerobic'
  | 'Overreaching';

export function getTrainingEffectLabel(value?: number): TrainingEffectLabel {
  if (!value) return 'Recovery';
  if (value < 1.0) return 'Recovery';
  if (value < 2.0) return 'Base';
  if (value < 3.0) return 'Improving Aerobic Fitness';
  if (value < 4.0) return 'Highly Aerobic';
  return 'Overreaching';
}
