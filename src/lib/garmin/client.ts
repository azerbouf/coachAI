import { GarminConnect } from 'garmin-connect';

export interface GarminActivity {
  activityId: number;
  activityName: string;
  activityType: {
    typeKey: string;
    typeId: number;
  };
  startTimeLocal: string;
  startTimeGMT: string;
  duration: number;
  distance: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number;
  averageHR: number;
  maxHR: number;
  calories: number;
  averageRunningCadenceInStepsPerMinute: number;
  strideLength: number;
  avgVerticalOscillation: number;
  avgGroundContactTime: number;
  avgVerticalRatio: number;
  avgGroundContactBalance: number;
  trainingEffectLabel: string;
  aerobicTrainingEffect: number;
  anaerobicTrainingEffect: number;
  activityTrainingLoad: number;
  vO2MaxValue: number;
  lactateThresholdHeartRateUsed: number;
  locationName: string;
  temperatureInCelsius: number;
  weatherPictoCodes: number;
}

export interface GarminActivityDetails {
  activityId: number;
  activityName: string;
  activityType: {
    typeKey: string;
  };
  startTimeLocal: string;
  duration: number;
  distance: number;
  averageHR: number;
  maxHR: number;
  calories: number;
  lapDTOs?: GarminLap[];
  splits?: GarminSplit[];
  hrTimeInZone_1?: number;
  hrTimeInZone_2?: number;
  hrTimeInZone_3?: number;
  hrTimeInZone_4?: number;
  hrTimeInZone_5?: number;
}

export interface GarminLap {
  lapIndex: number;
  startTimeGMT: string;
  startTimeLocal: string;
  duration: number;
  distance: number;
  averageSpeed: number;
  averageHR: number;
  maxHR: number;
  elevationGain: number;
  averageRunningCadenceInStepsPerMinute: number;
}

export interface GarminSplit {
  splitSummaryDTO: {
    splitIndex: number;
    splitDuration: number;
    splitDistance: number;
    averageSpeed: number;
    averageHR: number;
    maxHR: number;
    elevationGain: number;
    averageCadence: number;
  };
}

export interface GarminWellnessData {
  calendarDate: string;
  totalKilocalories: number;
  activeKilocalories: number;
  totalSteps: number;
  dailyStepGoal: number;
  restingHeartRate: number;
  averageStressLevel: number;
  maxStressLevel: number;
  restStressDuration: number;
  bodyBatteryChargedValue: number;
  bodyBatteryDrainedValue: number;
  bodyBatteryHighestValue: number;
  bodyBatteryLowestValue: number;
  averageWakingRespirationValue: number;
  averageSPO2Value: number;
}

export interface GarminHRVData {
  hrvSummary: {
    calendarDate: string;
    lastNight: number;
    weeklyAvg: number;
    baseline?: {
      lowUpper: number;
      highUpper: number;
      balancedLow: number;
      balancedUpper: number;
    };
    status: string;
    feedback: string;
  };
  hrvReadings: Array<{
    hrvValue: number;
    readingTimeGMT: string;
  }>;
}

export async function createGarminClient(
  email: string,
  password: string
): Promise<GarminConnect> {
  const client = new GarminConnect({
    username: email,
    password: password,
  });

  await client.login(email, password);
  return client;
}

export async function getActivities(
  client: GarminConnect,
  limit = 20,
  start = 0
): Promise<GarminActivity[]> {
  try {
    const activities = await client.getActivities(start, limit);
    return activities as unknown as GarminActivity[];
  } catch (error) {
    console.error('Error fetching Garmin activities:', error);
    throw new Error('Failed to fetch activities from Garmin');
  }
}

export async function getActivityDetails(
  client: GarminConnect,
  activityId: number
): Promise<GarminActivityDetails | null> {
  try {
    const details = await client.getActivity({ activityId });
    return details as unknown as GarminActivityDetails;
  } catch (error) {
    console.error(`Error fetching activity details for ${activityId}:`, error);
    return null;
  }
}

export async function getWellnessData(
  client: GarminConnect,
  date: Date
): Promise<GarminWellnessData | null> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const data = await client.getUserSummary(dateStr);
    return data as unknown as GarminWellnessData;
  } catch (error) {
    console.error('Error fetching wellness data:', error);
    return null;
  }
}

export async function getHRVData(
  client: GarminConnect,
  date: Date
): Promise<GarminHRVData | null> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const data = await (client as unknown as { getHrvData: (d: string) => Promise<unknown> }).getHrvData(dateStr);
    return data as GarminHRVData;
  } catch (error) {
    console.error('Error fetching HRV data:', error);
    return null;
  }
}

export async function getSleepData(
  client: GarminConnect,
  date: Date
): Promise<unknown | null> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const data = await client.getSleepData(dateStr);
    return data;
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    return null;
  }
}
