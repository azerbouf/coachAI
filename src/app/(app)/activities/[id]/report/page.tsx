import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { ReportView } from '@/components/activities/ReportView';
import type { Activity } from '@/types/activity';
import type { CoachAnalysis } from '@/types/coach';

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

export default async function ActivityReportPage({
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

  // Fetch analysis with service client (no cached_until filter — show any analysis)
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: analysisRow } = await service
    .from('coach_analyses')
    .select('*')
    .eq('user_id', user.id)
    .eq('analysis_type', 'activity')
    .eq('activity_id', params.id)
    .single();

  const analysis: CoachAnalysis | null = analysisRow
    ? {
        id: analysisRow.id,
        userId: analysisRow.user_id,
        analysisType: analysisRow.analysis_type,
        activityId: analysisRow.activity_id,
        headline: analysisRow.headline,
        summary: analysisRow.summary,
        fullAnalysis: analysisRow.full_analysis,
        modelUsed: analysisRow.model_used,
        tokensUsed: analysisRow.tokens_used,
        cachedUntil: analysisRow.cached_until,
        createdAt: analysisRow.created_at,
        updatedAt: analysisRow.updated_at,
      }
    : null;

  return <ReportView activity={activity} analysis={analysis} />;
}
