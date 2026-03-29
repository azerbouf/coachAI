import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PaceChart } from '@/components/activities/PaceChart';
import { HRZoneChart } from '@/components/activities/HRZoneChart';
import { SplitsTable } from '@/components/activities/SplitsTable';
import { RunDynamicsPanel } from '@/components/activities/RunDynamicsPanel';
import { CoachAnalysisPanel } from '@/components/activities/CoachAnalysisPanel';
import { MetricBadge } from '@/components/shared/MetricBadge';
import { ArrowLeft, Heart, Flame, Mountain, Clock, Route } from 'lucide-react';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';
import type { CoachAnalysis } from '@/types/coach';
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/activities"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Activities
        </Link>
      </div>

      {/* Hero header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="badge"
                style={{
                  color: teColor,
                  backgroundColor: `${teColor}15`,
                  border: `1px solid ${teColor}30`,
                }}
              >
                {teLabel}
              </span>
              {activity.vo2maxEstimate && (
                <span className="badge" style={{ color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  VO₂max {activity.vo2maxEstimate.toFixed(1)}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-text-primary">{activity.name}</h1>
            <p className="text-sm text-text-muted mt-1">
              {formatActivityDate(activity.startTime)}
              {activity.weatherCondition && ` · ${activity.weatherCondition}`}
              {activity.temperatureCelsius !== undefined &&
                ` · ${activity.temperatureCelsius.toFixed(0)}°C`}
            </p>
          </div>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl text-accent-green">
              {formatDistance(activity.distanceMeters, 2)}
            </div>
            <div className="stat-label flex items-center gap-1">
              <Route className="w-3 h-3" />
              km
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl">
              {formatPace(activity.avgPaceSecondsPerKm)}
            </div>
            <div className="stat-label">avg pace</div>
          </div>

          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl">
              {formatDuration(activity.durationSeconds)}
            </div>
            <div className="stat-label flex items-center gap-1">
              <Clock className="w-3 h-3" />
              time
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl" style={{ color: activity.elevationGainMeters ? '#60a5fa' : '#475569' }}>
              +{activity.elevationGainMeters?.toFixed(0) ?? '0'}
            </div>
            <div className="stat-label flex items-center gap-1">
              <Mountain className="w-3 h-3" />
              m gain
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl" style={{ color: '#f87171' }}>
              {activity.avgHR ?? '—'}
            </div>
            <div className="stat-label flex items-center gap-1">
              <Heart className="w-3 h-3" />
              avg HR
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="stat-value text-2xl" style={{ color: '#fbbf24' }}>
              {activity.calories ?? '—'}
            </div>
            <div className="stat-label flex items-center gap-1">
              <Flame className="w-3 h-3" />
              kcal
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Pace chart */}
          <div className="card">
            <h2 className="section-header mb-4">Pace per km</h2>
            <PaceChart
              splits={activity.splits}
              avgPace={activity.avgPaceSecondsPerKm}
            />
          </div>

          {/* HR Zone chart */}
          <div className="card">
            <h2 className="section-header mb-4">HR Zone Distribution</h2>
            <HRZoneChart
              hrZones={activity.hrZones}
              durationSeconds={activity.durationSeconds}
              maxHR={activity.maxHR ?? 190}
            />
          </div>

          {/* Splits table */}
          {activity.splits.length > 0 && (
            <div className="card">
              <h2 className="section-header mb-4">Splits</h2>
              <SplitsTable
                splits={activity.splits}
                avgPace={activity.avgPaceSecondsPerKm}
              />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Running dynamics */}
          <div className="card">
            <h2 className="section-header mb-4">Running Dynamics</h2>
            <RunDynamicsPanel activity={activity} />
          </div>

          {/* Coach analysis */}
          <div className="card">
            <h2 className="section-header mb-4">Coach Analysis</h2>
            <CoachAnalysisPanel
              activityId={activity.id}
              initialAnalysis={analysis}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
