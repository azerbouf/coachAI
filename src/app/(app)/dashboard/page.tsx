import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LastRunCard } from '@/components/dashboard/LastRunCard';
import { HRVCard } from '@/components/dashboard/HRVCard';
import { ReadinessCard } from '@/components/dashboard/ReadinessCard';
import { TrainingLoadCard } from '@/components/dashboard/TrainingLoadCard';
import { UpcomingWorkoutCard } from '@/components/dashboard/UpcomingWorkoutCard';
import { CoachInsightBanner } from '@/components/dashboard/CoachInsightBanner';
import type { Activity } from '@/types/activity';
import type { DailyWellness } from '@/types/recovery';
import type { TrainingWorkout } from '@/types/training';
import type { DailyTip } from '@/types/coach';
import { generatePlanWithDates, getNextWorkout } from '@/lib/training-plan/marathon-plan';

export const metadata: Metadata = {
  title: 'Dashboard',
};

async function getDashboardData(userId: string) {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [
    { data: activitiesRaw },
    { data: wellnessRaw },
    { data: hrvHistoryRaw },
    { data: dailyTipRaw },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(14),
    supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),
    supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('coach_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_type', 'daily_tip')
      .eq('analysis_date', today)
      .single(),
  ]);

  return {
    activities: (activitiesRaw ?? []) as unknown as Activity[],
    todayWellness: wellnessRaw as unknown as DailyWellness | null,
    hrvHistory: (hrvHistoryRaw ?? []) as unknown as DailyWellness[],
    dailyTip: dailyTipRaw?.full_analysis as unknown as DailyTip | null,
  };
}

function mapActivityFromDB(raw: Record<string, unknown>): Activity {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    garminActivityId: raw.garmin_activity_id as number | undefined,
    name: raw.name as string,
    activityType: raw.activity_type as string,
    startTime: raw.start_time as string,
    endTime: raw.end_time as string | undefined,
    durationSeconds: raw.duration_seconds as number,
    distanceMeters: raw.distance_meters as number,
    avgPaceSecondsPerKm: raw.avg_pace_seconds_per_km as number,
    bestPaceSecondsPerKm: raw.best_pace_seconds_per_km as number | undefined,
    elevationGainMeters: raw.elevation_gain_meters as number | undefined,
    elevationLossMeters: raw.elevation_loss_meters as number | undefined,
    maxElevationMeters: raw.max_elevation_meters as number | undefined,
    avgHR: raw.avg_hr as number | undefined,
    maxHR: raw.max_hr as number | undefined,
    calories: raw.calories as number | undefined,
    trainingEffectAerobic: raw.training_effect_aerobic as number | undefined,
    trainingEffectAnaerobic: raw.training_effect_anaerobic as number | undefined,
    trainingLoad: raw.training_load as number | undefined,
    vo2maxEstimate: raw.vo2max_estimate as number | undefined,
    lactateThresholdHR: raw.lactate_threshold_hr as number | undefined,
    avgCadence: raw.avg_cadence as number | undefined,
    avgStrideLength: raw.avg_stride_length_cm as number | undefined,
    avgVerticalOscillation: raw.avg_vertical_oscillation_cm as number | undefined,
    avgGroundContactTime: raw.avg_ground_contact_time_ms as number | undefined,
    avgVerticalRatio: raw.avg_vertical_ratio as number | undefined,
    avgGroundContactBalance: raw.avg_ground_contact_balance as number | undefined,
    splits: (raw.splits as Activity['splits']) ?? [],
    hrZones: (raw.hr_zones as Activity['hrZones']) ?? {
      zone1Seconds: 0, zone2Seconds: 0, zone3Seconds: 0, zone4Seconds: 0, zone5Seconds: 0,
      zone1Percent: 0, zone2Percent: 0, zone3Percent: 0, zone4Percent: 0, zone5Percent: 0,
    },
    temperatureCelsius: raw.temperature_celsius as number | undefined,
    weatherCondition: raw.weather_condition as string | undefined,
    isAnalyzed: raw.is_analyzed as boolean,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activities: rawActivities, todayWellness, hrvHistory, dailyTip } =
    await getDashboardData(user.id);

  const activities = rawActivities.map((a) => mapActivityFromDB(a as unknown as Record<string, unknown>));
  const lastRun = activities[0] ?? null;

  // Get coach verdict for last run
  let coachVerdict: string | undefined;
  if (lastRun?.isAnalyzed) {
    const { data: analysis } = await createClient()
      .from('coach_analyses')
      .select('headline')
      .eq('user_id', user.id)
      .eq('activity_id', lastRun.id)
      .single();
    coachVerdict = analysis?.headline ?? undefined;
  }

  // Get next workout from plan
  const plan = generatePlanWithDates();
  const nextWorkoutTemplate = getNextWorkout(plan);
  const nextWorkout: TrainingWorkout | null = nextWorkoutTemplate
    ? {
        weekNumber: nextWorkoutTemplate.weekNumber,
        dayOfWeek: nextWorkoutTemplate.dayOfWeek,
        scheduledDate: nextWorkoutTemplate.scheduledDate,
        workoutType: nextWorkoutTemplate.workoutType,
        distanceKm: nextWorkoutTemplate.distanceKm,
        description: nextWorkoutTemplate.description,
        notes: nextWorkoutTemplate.notes,
        isCompleted: false,
      }
    : null;

  // Map wellness
  const wellness = todayWellness as unknown as DailyWellness | null;
  const hrvHistoryMapped = (hrvHistory as unknown as DailyWellness[]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Your training overview at a glance
        </p>
      </div>

      {/* Daily AI insight */}
      <CoachInsightBanner tip={dailyTip} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Last run — takes 2 cols */}
        <div className="lg:col-span-2">
          {lastRun ? (
            <LastRunCard activity={lastRun} coachVerdict={coachVerdict} />
          ) : (
            <div className="card h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">🏃</div>
              <h3 className="text-base font-semibold text-text-secondary mb-1">
                No runs yet
              </h3>
              <p className="text-sm text-text-muted">
                Sync your Garmin data to see your last run here
              </p>
            </div>
          )}
        </div>

        {/* Upcoming workout */}
        <div>
          <UpcomingWorkoutCard workout={nextWorkout} />
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HRVCard latest={wellness} history={hrvHistoryMapped} />
        <ReadinessCard wellness={wellness} />
        <TrainingLoadCard activities={activities} />
      </div>
    </div>
  );
}
