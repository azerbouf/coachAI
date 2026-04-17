import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ActivityPanels } from '@/components/activities/ActivityPanels';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Heart, Mountain } from 'lucide-react';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';
import type { CoachAnalysis, RunAnalysis } from '@/types/coach';
import type { DailyWellness } from '@/types/recovery';
import { getCachedActivityAnalysis } from '@/lib/claude/analyze';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Activity`,
  };
}

function mapActivity(raw: Record<string, unknown>): Activity {
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

export default async function ActivityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawActivity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!rawActivity) notFound();

  const activity = mapActivity(rawActivity as unknown as Record<string, unknown>);
  const teColor = getTrainingEffectColor(activity.trainingEffectAerobic);
  const teLabel = getTrainingEffectLabel(activity.trainingEffectAerobic);

  // Get cached analysis if available
  let analysis: CoachAnalysis | null = null;
  if (activity.isAnalyzed) {
    try {
      analysis = await getCachedActivityAnalysis(activity.id, user.id);
    } catch {
      // Analysis not available
    }
  }

  // Fetch wellness for activity date
  const activityDate = activity.startTime.split('T')[0];
  const { data: wellnessRaw } = await supabase
    .from('daily_wellness')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', activityDate)
    .single();

  const wellness: DailyWellness | null = wellnessRaw
    ? {
        id: wellnessRaw.id,
        userId: wellnessRaw.user_id,
        date: wellnessRaw.date,
        hrvLastNightMs: wellnessRaw.hrv_last_night_ms ?? undefined,
        hrvBaselineLow: wellnessRaw.hrv_baseline_low ?? undefined,
        hrvBaselineHigh: wellnessRaw.hrv_baseline_high ?? undefined,
        hrvStatus: wellnessRaw.hrv_status ?? undefined,
        sleepScore: wellnessRaw.sleep_score ?? undefined,
        sleepDurationSeconds: wellnessRaw.sleep_duration_seconds ?? undefined,
        bodyBatteryCharged: wellnessRaw.body_battery_charged ?? undefined,
        bodyBatteryDrained: wellnessRaw.body_battery_drained ?? undefined,
        bodyBatteryHighest: wellnessRaw.body_battery_highest ?? undefined,
        bodyBatteryLowest: wellnessRaw.body_battery_lowest ?? undefined,
        avgStressLevel: wellnessRaw.avg_stress_level ?? undefined,
        maxStressLevel: wellnessRaw.max_stress_level ?? undefined,
        trainingReadinessScore: wellnessRaw.training_readiness_score ?? undefined,
        trainingReadinessDescription: wellnessRaw.training_readiness_description ?? undefined,
        restingHR: wellnessRaw.resting_hr ?? undefined,
        totalSteps: wellnessRaw.total_steps ?? undefined,
        createdAt: wellnessRaw.created_at,
        updatedAt: wellnessRaw.updated_at,
      }
    : null;

  const run = analysis?.fullAnalysis as RunAnalysis | null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── FLAT HEADER ── */}
      <div className="pb-5 border-b border-border">
        {/* Back link */}
        <Link
          href="/activities"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All Activities
        </Link>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary mb-1.5 leading-tight">
              {activity.name}
            </h1>
            <p className="text-sm text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{formatDistance(activity.distanceMeters, 2)} km</span>
              <span>·</span>
              <span>{formatDuration(activity.durationSeconds)}</span>
              <span>·</span>
              <span>{formatActivityDate(activity.startTime)}</span>
              {activity.weatherCondition && (
                <><span>·</span><span>{activity.weatherCondition}</span></>
              )}
              {activity.temperatureCelsius != null && (
                <><span>·</span><span>{activity.temperatureCelsius.toFixed(0)}°C</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: teColor, backgroundColor: `${teColor}18`, border: `1px solid ${teColor}30` }}
            >
              {teLabel}
            </Badge>
            {activity.vo2maxEstimate && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                VO₂max {activity.vo2maxEstimate.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Pace</span>
          <span className="font-bold text-text-primary ml-0.5">{formatPace(activity.avgPaceSecondsPerKm)} /km</span>
        </div>
        {activity.avgHR && (
          <div className="flex items-center gap-2 text-sm">
            <Heart className="w-4 h-4 text-text-muted" />
            <span className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Avg HR</span>
            <span className="font-bold ml-0.5" style={{ color: '#ef4444' }}>{activity.avgHR} bpm</span>
          </div>
        )}
        {(activity.elevationGainMeters ?? 0) > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Mountain className="w-4 h-4 text-text-muted" />
            <span className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Elevation</span>
            <span className="font-bold text-text-primary ml-0.5">+{activity.elevationGainMeters!.toFixed(0)} m</span>
          </div>
        )}
      </div>

      <ActivityPanels activity={activity} analysis={analysis} wellness={wellness} />
    </div>
  );
}
