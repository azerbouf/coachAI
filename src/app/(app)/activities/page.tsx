import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Activity as ActivityIcon } from 'lucide-react';
import type { Activity } from '@/types/activity';

export const metadata: Metadata = {
  title: 'Activities',
};

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

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Only select columns needed for the list view — skip splits/hr_zones/dynamics (large JSON)
  const LIST_COLUMNS = [
    'id', 'user_id', 'garmin_activity_id', 'name', 'activity_type',
    'start_time', 'end_time', 'duration_seconds', 'distance_meters',
    'avg_pace_seconds_per_km', 'elevation_gain_meters',
    'avg_hr', 'calories', 'training_effect_aerobic', 'is_analyzed',
    'created_at', 'updated_at',
  ].join(', ');

  let query = supabase
    .from('activities')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (searchParams.type && searchParams.type !== 'all') {
    query = query.ilike('activity_type', `%${searchParams.type}%`);
  }

  // Run activity fetch and verdict fetch in parallel
  const [{ data: rawActivities, count }, { data: analyses }] = await Promise.all([
    query,
    supabase
      .from('coach_analyses')
      .select('activity_id, headline')
      .eq('user_id', user.id)
      .eq('analysis_type', 'activity')
      .range(offset, offset + pageSize - 1),
  ]);

  const activities = (rawActivities ?? []).map((a) =>
    mapActivity(a as unknown as Record<string, unknown>)
  );

  const verdicts: Record<string, string> = Object.fromEntries(
    (analyses ?? []).map((a) => [a.activity_id, a.headline])
  );

  const totalPages = Math.ceil((count ?? 0) / pageSize);
  const activeType = searchParams.type ?? 'all';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activities</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {count ?? 0} total runs synced
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Runs' },
          { value: 'running', label: 'Road' },
          { value: 'trail', label: 'Trail' },
        ].map((filter) => (
          <Button
            key={filter.value}
            variant={activeType === filter.value ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <a href={`/activities${filter.value !== 'all' ? `?type=${filter.value}` : ''}`}>
              {filter.label}
            </a>
          </Button>
        ))}
      </div>

      {/* Activities list */}
      {activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="w-12 h-12" />}
          title="No activities yet"
          description="Sync your Garmin data to see your runs here"
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              coachVerdict={verdicts[activity.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/activities?page=${page - 1}${searchParams.type ? `&type=${searchParams.type}` : ''}`}>
                Previous
              </a>
            </Button>
          )}
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/activities?page=${page + 1}${searchParams.type ? `&type=${searchParams.type}` : ''}`}>
                Next
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
