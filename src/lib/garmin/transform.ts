import type {
  GarminActivity,
  GarminActivityDetails,
  GarminWellnessData,
  GarminHRVData,
} from './client';

export interface ActivityInsert {
  user_id: string;
  garmin_activity_id: number;
  name: string;
  activity_type: string;
  start_time: string;
  duration_seconds: number;
  distance_meters: number;
  avg_pace_seconds_per_km: number;
  best_pace_seconds_per_km: number | null;
  elevation_gain_meters: number | null;
  elevation_loss_meters: number | null;
  max_elevation_meters: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  training_effect_aerobic: number | null;
  training_effect_anaerobic: number | null;
  training_load: number | null;
  vo2max_estimate: number | null;
  lactate_threshold_hr: number | null;
  avg_cadence: number | null;
  avg_stride_length_cm: number | null;
  avg_vertical_oscillation_cm: number | null;
  avg_ground_contact_time_ms: number | null;
  avg_vertical_ratio: number | null;
  avg_ground_contact_balance: number | null;
  splits: object[];
  hr_zones: object;
  temperature_celsius: number | null;
  weather_condition: string | null;
  raw_data: object;
}

export interface WellnessInsert {
  user_id: string;
  date: string;
  hrv_last_night_ms: number | null;
  hrv_baseline_low: number | null;
  hrv_baseline_high: number | null;
  hrv_status: string | null;
  sleep_score: number | null;
  sleep_duration_seconds: number | null;
  sleep_deep_seconds: number | null;
  sleep_rem_seconds: number | null;
  sleep_light_seconds: number | null;
  sleep_awake_seconds: number | null;
  body_battery_charged: number | null;
  body_battery_drained: number | null;
  body_battery_highest: number | null;
  body_battery_lowest: number | null;
  avg_stress_level: number | null;
  max_stress_level: number | null;
  rest_stress_duration_seconds: number | null;
  avg_waking_respiration_value: number | null;
  avg_spo2_value: number | null;
  training_readiness_score: number | null;
  training_readiness_description: string | null;
  total_steps: number | null;
  daily_step_goal: number | null;
  resting_hr: number | null;
  raw_data: object;
}

function safeNum(val: unknown): number | null {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  const n = Number(val);
  if (!isFinite(n)) return null;
  return n;
}

function safeStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

export function transformActivity(
  activity: GarminActivity,
  userId: string,
  details?: GarminActivityDetails
): ActivityInsert {
  // Convert m/s → seconds per km
  const avgSpeedMps = safeNum(activity.averageSpeed) ?? 0;
  const avgPaceSecondsPerKm =
    avgSpeedMps > 0 ? Math.round(1000 / avgSpeedMps) : 0;

  const maxSpeedMps = safeNum(activity.maxSpeed) ?? 0;
  const bestPaceSecondsPerKm =
    maxSpeedMps > 0 ? Math.round(1000 / maxSpeedMps) : null;

  // Build splits from lap data if available
  const splits: object[] = [];
  if (details?.lapDTOs && Array.isArray(details.lapDTOs)) {
    details.lapDTOs.forEach((lap, idx) => {
      const lapSpeedMps = safeNum(lap.averageSpeed) ?? 0;
      const lapPace = lapSpeedMps > 0 ? Math.round(1000 / lapSpeedMps) : 0;
      splits.push({
        splitNumber: idx + 1,
        distanceMeters: safeNum(lap.distance) ?? 0,
        durationSeconds: safeNum(lap.duration) ?? 0,
        paceSecondsPerKm: lapPace,
        avgHR: safeNum(lap.averageHR) ?? 0,
        maxHR: safeNum(lap.maxHR) ?? 0,
        elevationGain: safeNum(lap.elevationGain) ?? 0,
        cadence: safeNum(lap.averageRunningCadenceInStepsPerMinute) ?? 0,
      });
    });
  }

  // Build HR zones
  const totalDuration = safeNum(activity.duration) ?? 1;
  const hrZones = buildHRZones(details, totalDuration);

  // Weather mapping
  const weatherCondition = mapWeatherCode(
    safeNum(activity.weatherPictoCodes) ?? 0
  );

  return {
    user_id: userId,
    garmin_activity_id: activity.activityId,
    name: activity.activityName || 'Running',
    activity_type: activity.activityType?.typeKey ?? 'running',
    start_time: activity.startTimeGMT || activity.startTimeLocal,
    duration_seconds: Math.round(safeNum(activity.duration) ?? 0),
    distance_meters: safeNum(activity.distance) ?? 0,
    avg_pace_seconds_per_km: avgPaceSecondsPerKm,
    best_pace_seconds_per_km: bestPaceSecondsPerKm,
    elevation_gain_meters: safeNum(activity.elevationGain),
    elevation_loss_meters: safeNum(activity.elevationLoss),
    max_elevation_meters: safeNum(activity.maxElevation),
    avg_hr: safeNum(activity.averageHR),
    max_hr: safeNum(activity.maxHR),
    calories: safeNum(activity.calories),
    training_effect_aerobic: safeNum(activity.aerobicTrainingEffect),
    training_effect_anaerobic: safeNum(activity.anaerobicTrainingEffect),
    training_load: safeNum(activity.activityTrainingLoad),
    vo2max_estimate: safeNum(activity.vO2MaxValue),
    lactate_threshold_hr: safeNum(activity.lactateThresholdHeartRateUsed),
    avg_cadence: safeNum(activity.averageRunningCadenceInStepsPerMinute),
    avg_stride_length_cm:
      safeNum(activity.strideLength) != null
        ? (safeNum(activity.strideLength) as number) * 100
        : null,
    avg_vertical_oscillation_cm: safeNum(activity.avgVerticalOscillation),
    avg_ground_contact_time_ms: safeNum(activity.avgGroundContactTime),
    avg_vertical_ratio: safeNum(activity.avgVerticalRatio),
    avg_ground_contact_balance: safeNum(activity.avgGroundContactBalance),
    splits,
    hr_zones: hrZones,
    temperature_celsius: safeNum(activity.temperatureInCelsius),
    weather_condition: weatherCondition,
    raw_data: activity as unknown as object,
  };
}

function buildHRZones(
  details: GarminActivityDetails | undefined,
  totalDuration: number
) {
  if (!details) {
    return {
      zone1Seconds: 0,
      zone2Seconds: 0,
      zone3Seconds: 0,
      zone4Seconds: 0,
      zone5Seconds: 0,
      zone1Percent: 0,
      zone2Percent: 0,
      zone3Percent: 0,
      zone4Percent: 0,
      zone5Percent: 0,
    };
  }

  const z1 = safeNum(details.hrTimeInZone_1) ?? 0;
  const z2 = safeNum(details.hrTimeInZone_2) ?? 0;
  const z3 = safeNum(details.hrTimeInZone_3) ?? 0;
  const z4 = safeNum(details.hrTimeInZone_4) ?? 0;
  const z5 = safeNum(details.hrTimeInZone_5) ?? 0;
  const total = totalDuration || z1 + z2 + z3 + z4 + z5 || 1;

  return {
    zone1Seconds: Math.round(z1),
    zone2Seconds: Math.round(z2),
    zone3Seconds: Math.round(z3),
    zone4Seconds: Math.round(z4),
    zone5Seconds: Math.round(z5),
    zone1Percent: Math.round((z1 / total) * 100),
    zone2Percent: Math.round((z2 / total) * 100),
    zone3Percent: Math.round((z3 / total) * 100),
    zone4Percent: Math.round((z4 / total) * 100),
    zone5Percent: Math.round((z5 / total) * 100),
  };
}

function mapWeatherCode(code: number): string | null {
  const map: Record<number, string> = {
    0: 'Clear',
    1: 'Partly Cloudy',
    2: 'Mostly Cloudy',
    3: 'Rain',
    4: 'Wind',
    5: 'Thunderstorm',
    6: 'Snow',
    7: 'Mist',
    8: 'Hail',
    11: 'Fog',
    12: 'Rain',
    13: 'Mostly Cloudy',
    14: 'Partly Cloudy',
    15: 'Thunder',
    16: 'Light Rain',
    17: 'Rain and Hail',
    18: 'Light Snow',
    19: 'Snow',
    20: 'Snow and Hail',
    21: 'Freezing Rain',
    22: 'Rain and Snow',
    23: 'Rain and Hail',
    26: 'Freezing Drizzle',
    29: 'Rain and Hail',
    33: 'Clear',
    34: 'Partly Cloudy',
    35: 'Mostly Cloudy',
    36: 'Flurries',
    37: 'Mostly Cloudy',
    38: 'Cloudy',
    39: 'Partly Cloudy with Showers',
    40: 'Mostly Cloudy with Showers',
    41: 'Partly Cloudy with T-Storms',
    42: 'Mostly Cloudy with T-Storms',
    43: 'Mostly Cloudy with Flurries',
    44: 'Mostly Cloudy with Snow',
  };
  return map[code] ?? safeStr(code);
}

export function transformWellness(
  wellness: GarminWellnessData,
  hrv: GarminHRVData | null,
  sleepData: unknown,
  userId: string,
  date: string
): WellnessInsert {
  const sleepObj = sleepData as Record<string, unknown> | null;
  const sleepSummary = (sleepObj?.dailySleepDTO as Record<string, unknown>) ?? {};

  // Map HRV status
  let hrvStatus: string | null = null;
  if (hrv?.hrvSummary?.status) {
    const statusMap: Record<string, string> = {
      BALANCED: 'BALANCED',
      LOW: 'LOW',
      UNBALANCED: 'UNBALANCED',
      HIGH: 'HIGH',
    };
    hrvStatus = statusMap[hrv.hrvSummary.status.toUpperCase()] ?? null;
  }

  return {
    user_id: userId,
    date,
    hrv_last_night_ms: hrv ? safeNum(hrv.hrvSummary?.lastNight) : null,
    hrv_baseline_low: hrv
      ? safeNum(hrv.hrvSummary?.baseline?.balancedLow)
      : null,
    hrv_baseline_high: hrv
      ? safeNum(hrv.hrvSummary?.baseline?.balancedUpper)
      : null,
    hrv_status: hrvStatus,
    sleep_score: safeNum(sleepSummary.sleepScores as unknown),
    sleep_duration_seconds: safeNum(sleepSummary.sleepTimeSeconds as unknown),
    sleep_deep_seconds: safeNum(sleepSummary.deepSleepSeconds as unknown),
    sleep_rem_seconds: safeNum(sleepSummary.remSleepSeconds as unknown),
    sleep_light_seconds: safeNum(sleepSummary.lightSleepSeconds as unknown),
    sleep_awake_seconds: safeNum(sleepSummary.awakeSleepSeconds as unknown),
    body_battery_charged: safeNum(wellness.bodyBatteryChargedValue),
    body_battery_drained: safeNum(wellness.bodyBatteryDrainedValue),
    body_battery_highest: safeNum(wellness.bodyBatteryHighestValue),
    body_battery_lowest: safeNum(wellness.bodyBatteryLowestValue),
    avg_stress_level: safeNum(wellness.averageStressLevel),
    max_stress_level: safeNum(wellness.maxStressLevel),
    rest_stress_duration_seconds: safeNum(wellness.restStressDuration),
    avg_waking_respiration_value: safeNum(wellness.averageWakingRespirationValue),
    avg_spo2_value: safeNum(wellness.averageSPO2Value),
    training_readiness_score: null,
    training_readiness_description: null,
    total_steps: safeNum(wellness.totalSteps),
    daily_step_goal: safeNum(wellness.dailyStepGoal),
    resting_hr: safeNum(wellness.restingHeartRate),
    raw_data: { wellness, hrv, sleep: sleepData } as object,
  };
}
