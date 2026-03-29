import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { HRVTrendChart } from '@/components/recovery/HRVTrendChart';
import { SleepScoreChart } from '@/components/recovery/SleepScoreChart';
import { RecoveryStatusCard } from '@/components/recovery/RecoveryStatusCard';
import type { DailyWellness } from '@/types/recovery';
import { subDays, format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Recovery',
};

function mapWellness(raw: Record<string, unknown>): DailyWellness {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    date: raw.date as string,
    hrvLastNightMs: raw.hrv_last_night_ms as number | undefined,
    hrvBaselineLow: raw.hrv_baseline_low as number | undefined,
    hrvBaselineHigh: raw.hrv_baseline_high as number | undefined,
    hrvStatus: raw.hrv_status as DailyWellness['hrvStatus'],
    sleepScore: raw.sleep_score as number | undefined,
    sleepDurationSeconds: raw.sleep_duration_seconds as number | undefined,
    sleepDeepSeconds: raw.sleep_deep_seconds as number | undefined,
    sleepRemSeconds: raw.sleep_rem_seconds as number | undefined,
    sleepLightSeconds: raw.sleep_light_seconds as number | undefined,
    sleepAwakeSeconds: raw.sleep_awake_seconds as number | undefined,
    bodyBatteryCharged: raw.body_battery_charged as number | undefined,
    bodyBatteryDrained: raw.body_battery_drained as number | undefined,
    bodyBatteryHighest: raw.body_battery_highest as number | undefined,
    bodyBatteryLowest: raw.body_battery_lowest as number | undefined,
    avgStressLevel: raw.avg_stress_level as number | undefined,
    maxStressLevel: raw.max_stress_level as number | undefined,
    restStressDurationSeconds: raw.rest_stress_duration_seconds as number | undefined,
    avgWakingRespirationValue: raw.avg_waking_respiration_value as number | undefined,
    avgSpo2Value: raw.avg_spo2_value as number | undefined,
    trainingReadinessScore: raw.training_readiness_score as number | undefined,
    trainingReadinessDescription: raw.training_readiness_description as string | undefined,
    totalSteps: raw.total_steps as number | undefined,
    dailyStepGoal: raw.daily_step_goal as number | undefined,
    restingHR: raw.resting_hr as number | undefined,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

export default async function RecoveryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [{ data: wellnessRaw }, { data: todayRaw }] = await Promise.all([
    supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single(),
  ]);

  const wellness = (wellnessRaw ?? []).map((w) =>
    mapWellness(w as unknown as Record<string, unknown>)
  );
  const todayWellness = todayRaw
    ? mapWellness(todayRaw as unknown as Record<string, unknown>)
    : null;

  // Calculate averages
  const avgHRV =
    wellness.filter((w) => w.hrvLastNightMs).length > 0
      ? wellness
          .filter((w) => w.hrvLastNightMs)
          .reduce((sum, w) => sum + (w.hrvLastNightMs ?? 0), 0) /
        wellness.filter((w) => w.hrvLastNightMs).length
      : null;

  const avgSleep =
    wellness.filter((w) => w.sleepScore).length > 0
      ? wellness
          .filter((w) => w.sleepScore)
          .reduce((sum, w) => sum + (w.sleepScore ?? 0), 0) /
        wellness.filter((w) => w.sleepScore).length
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Recovery</h1>
        <p className="text-sm text-text-muted mt-0.5">
          30-day wellness trends and today&apos;s status
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div
            className="text-xl font-bold"
            style={{
              color:
                todayWellness?.hrvStatus === 'BALANCED'
                  ? '#34d399'
                  : todayWellness?.hrvStatus === 'LOW'
                    ? '#f87171'
                    : '#fbbf24',
            }}
          >
            {todayWellness?.hrvLastNightMs
              ? Math.round(todayWellness.hrvLastNightMs)
              : '—'}
          </div>
          <div className="stat-label mt-0.5">HRV today (ms)</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold" style={{ color: '#60a5fa' }}>
            {avgHRV ? Math.round(avgHRV) : '—'}
          </div>
          <div className="stat-label mt-0.5">30-day avg HRV</div>
        </div>
        <div className="card text-center">
          <div
            className="text-xl font-bold"
            style={{
              color:
                (todayWellness?.sleepScore ?? 0) >= 80
                  ? '#34d399'
                  : (todayWellness?.sleepScore ?? 0) >= 60
                    ? '#fbbf24'
                    : '#f87171',
            }}
          >
            {todayWellness?.sleepScore ?? '—'}
          </div>
          <div className="stat-label mt-0.5">Sleep score today</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold" style={{ color: '#fbbf24' }}>
            {avgSleep ? Math.round(avgSleep) : '—'}
          </div>
          <div className="stat-label mt-0.5">30-day avg sleep</div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: status */}
        <div>
          <RecoveryStatusCard wellness={todayWellness} />
        </div>

        {/* Right: charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="section-header mb-4">HRV Trend (30 days)</h2>
            <HRVTrendChart data={wellness} />
          </div>

          <div className="card">
            <h2 className="section-header mb-4">Sleep Score (14 days)</h2>
            <SleepScoreChart data={wellness} />
          </div>
        </div>
      </div>
    </div>
  );
}
