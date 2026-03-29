import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeActivity } from '@/lib/claude/analyze';
import type { Activity } from '@/types/activity';
import type { DailyWellness } from '@/types/recovery';

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

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityId, forceRefresh = false } = body;

    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId is required' },
        { status: 400 }
      );
    }

    // Fetch the activity
    const { data: rawActivity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', user.id)
      .single();

    if (activityError || !rawActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const activity = mapActivity(rawActivity as unknown as Record<string, unknown>);

    // Get previous activities for context
    const { data: prevRaw } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .lt('start_time', activity.startTime)
      .order('start_time', { ascending: false })
      .limit(5);

    const previousActivities = (prevRaw ?? []).map((a) =>
      mapActivity(a as unknown as Record<string, unknown>)
    );

    // Get wellness data for the activity date
    const activityDate = activity.startTime.split('T')[0];
    const { data: wellnessRaw } = await supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', activityDate)
      .single();

    const wellness = wellnessRaw
      ? ({
          id: wellnessRaw.id,
          userId: wellnessRaw.user_id,
          date: wellnessRaw.date,
          hrvLastNightMs: wellnessRaw.hrv_last_night_ms,
          hrvBaselineLow: wellnessRaw.hrv_baseline_low,
          hrvBaselineHigh: wellnessRaw.hrv_baseline_high,
          hrvStatus: wellnessRaw.hrv_status,
          sleepScore: wellnessRaw.sleep_score,
          bodyBatteryCharged: wellnessRaw.body_battery_charged,
          bodyBatteryHighest: wellnessRaw.body_battery_highest,
          avgStressLevel: wellnessRaw.avg_stress_level,
          trainingReadinessScore: wellnessRaw.training_readiness_score,
          createdAt: wellnessRaw.created_at,
          updatedAt: wellnessRaw.updated_at,
        } as unknown as DailyWellness)
      : null;

    // Run analysis
    const analysis = await analyzeActivity(
      activity,
      user.id,
      previousActivities,
      wellness,
      forceRefresh
    );

    // Fetch the saved analysis record
    const { data: savedAnalysis } = await supabase
      .from('coach_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('analysis_type', 'activity')
      .eq('activity_id', activityId)
      .single();

    return NextResponse.json(
      savedAnalysis
        ? {
            id: savedAnalysis.id,
            userId: savedAnalysis.user_id,
            analysisType: savedAnalysis.analysis_type,
            activityId: savedAnalysis.activity_id,
            headline: savedAnalysis.headline,
            summary: savedAnalysis.summary,
            fullAnalysis: savedAnalysis.full_analysis,
            modelUsed: savedAnalysis.model_used,
            createdAt: savedAnalysis.created_at,
            updatedAt: savedAnalysis.updated_at,
          }
        : { fullAnalysis: analysis }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Analysis failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
