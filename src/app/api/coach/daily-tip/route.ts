import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDailyTip } from '@/lib/claude/analyze';
import type { Activity } from '@/types/activity';
import type { DailyWellness } from '@/types/recovery';

function mapActivity(raw: Record<string, unknown>): Activity {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    activityType: raw.activity_type as string,
    startTime: raw.start_time as string,
    durationSeconds: raw.duration_seconds as number,
    distanceMeters: raw.distance_meters as number,
    avgPaceSecondsPerKm: raw.avg_pace_seconds_per_km as number,
    trainingLoad: raw.training_load as number | undefined,
    trainingEffectAerobic: raw.training_effect_aerobic as number | undefined,
    splits: [],
    hrZones: {
      zone1Seconds: 0, zone2Seconds: 0, zone3Seconds: 0, zone4Seconds: 0, zone5Seconds: 0,
      zone1Percent: 0, zone2Percent: 0, zone3Percent: 0, zone4Percent: 0, zone5Percent: 0,
    },
    isAnalyzed: raw.is_analyzed as boolean,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const today = new Date().toISOString().split('T')[0];

    // Check if cached tip exists
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('coach_analyses')
        .select('*')
        .eq('user_id', user.id)
        .eq('analysis_type', 'daily_tip')
        .eq('analysis_date', today)
        .gt('cached_until', new Date().toISOString())
        .single();

      if (cached?.full_analysis) {
        return NextResponse.json(cached.full_analysis);
      }
    }

    // Get recent activities
    const { data: activitiesRaw } = await supabase
      .from('activities')
      .select(
        'id, user_id, name, activity_type, start_time, duration_seconds, distance_meters, avg_pace_seconds_per_km, training_load, training_effect_aerobic, is_analyzed, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(7);

    const recentActivities = (activitiesRaw ?? []).map((a) =>
      mapActivity(a as unknown as Record<string, unknown>)
    );

    // Get today's wellness
    const { data: wellnessRaw } = await supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const wellness = wellnessRaw
      ? ({
          id: wellnessRaw.id,
          userId: wellnessRaw.user_id,
          date: wellnessRaw.date,
          hrvLastNightMs: wellnessRaw.hrv_last_night_ms,
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

    const tip = await generateDailyTip(
      user.id,
      recentActivities,
      wellness,
      forceRefresh
    );

    return NextResponse.json(tip);
  } catch (error) {
    console.error('Daily tip error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate daily tip',
      },
      { status: 500 }
    );
  }
}
