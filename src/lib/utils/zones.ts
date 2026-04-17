import type { HRZone } from '@/types/activity';

export interface HRZoneConfig {
  zone: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
  minPercent: number; // % of maxHR
  maxPercent: number;
  color: string;
}

export const HR_ZONE_CONFIGS: HRZoneConfig[] = [
  {
    zone: 1,
    label: 'Zone 1',
    description: 'Recovery',
    minPercent: 0,
    maxPercent: 60,
    color: '#34d399',
  },
  {
    zone: 2,
    label: 'Zone 2',
    description: 'Aerobic Base',
    minPercent: 60,
    maxPercent: 70,
    color: '#60a5fa',
  },
  {
    zone: 3,
    label: 'Zone 3',
    description: 'Aerobic Tempo',
    minPercent: 70,
    maxPercent: 80,
    color: '#fbbf24',
  },
  {
    zone: 4,
    label: 'Zone 4',
    description: 'Lactate Threshold',
    minPercent: 80,
    maxPercent: 90,
    color: '#fb923c',
  },
  {
    zone: 5,
    label: 'Zone 5',
    description: 'VO2max',
    minPercent: 90,
    maxPercent: 100,
    color: '#f87171',
  },
];

/**
 * Calculate HR zone boundaries from max HR
 */
export function calculateHRZones(maxHR: number): HRZone[] {
  return HR_ZONE_CONFIGS.map((config) => ({
    zone: config.zone,
    label: config.label,
    minHR: Math.round(maxHR * (config.minPercent / 100)),
    maxHR: Math.round(maxHR * (config.maxPercent / 100)),
    color: config.color,
    seconds: 0,
    percent: 0,
  }));
}

/**
 * Get zone for a given HR value
 */
export function getZoneForHR(hr: number, maxHR: number): 1 | 2 | 3 | 4 | 5 {
  const percent = (hr / maxHR) * 100;
  if (percent < 60) return 1;
  if (percent < 70) return 2;
  if (percent < 80) return 3;
  if (percent < 90) return 4;
  return 5;
}

/**
 * Get color for HR value based on zones
 */
export function getHRColor(hr: number, maxHR = 190): string {
  const zone = getZoneForHR(hr, maxHR);
  return HR_ZONE_CONFIGS[zone - 1].color;
}

/**
 * Get color based on avg HR for list display
 */
export function getHRStatusColor(avgHR: number): string {
  if (avgHR < 130) return '#16a34a'; // green - easy
  if (avgHR < 150) return '#2563eb'; // blue - moderate
  if (avgHR < 165) return '#d97706'; // yellow - tempo
  if (avgHR < 175) return '#ea580c'; // orange - threshold
  return '#dc2626'; // red - max
}

/**
 * Get training zone label from aerobic TE score
 */
export function getTrainingEffectLabel(value?: number): string {
  if (!value) return 'Recovery';
  if (value < 1.0) return 'Recovery';
  if (value < 2.0) return 'Base';
  if (value < 3.0) return 'Improving';
  if (value < 4.0) return 'Highly Aerobic';
  if (value < 5.0) return 'Overreaching';
  return 'Overloading';
}

/**
 * Get training effect color
 */
export function getTrainingEffectColor(value?: number): string {
  if (!value) return '#94a3b8';
  if (value < 1.0) return '#94a3b8';
  if (value < 2.0) return '#16a34a';
  if (value < 3.0) return '#2563eb';
  if (value < 4.0) return '#7c3aed';
  if (value < 4.5) return '#ea580c';
  return '#dc2626';
}

/**
 * Convert zone seconds distribution to array of HRZone objects
 */
export function buildHRZoneArray(
  hrZones: {
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
  },
  maxHR = 190
): HRZone[] {
  const zones = calculateHRZones(maxHR);
  return zones.map((zone, idx) => ({
    ...zone,
    seconds: [
      hrZones.zone1Seconds,
      hrZones.zone2Seconds,
      hrZones.zone3Seconds,
      hrZones.zone4Seconds,
      hrZones.zone5Seconds,
    ][idx],
    percent: [
      hrZones.zone1Percent,
      hrZones.zone2Percent,
      hrZones.zone3Percent,
      hrZones.zone4Percent,
      hrZones.zone5Percent,
    ][idx],
  }));
}
