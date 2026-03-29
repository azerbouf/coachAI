'use client';

import type { DailyWellness } from '@/types/recovery';

interface RecoveryStatusCardProps {
  wellness: DailyWellness | null;
}

function CircularRing({
  score,
  size = 80,
  label,
  color,
}: {
  score: number;
  size?: number;
  label: string;
  color: string;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={7}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted font-medium text-center">{label}</span>
    </div>
  );
}

const HRV_STATUS_COLORS: Record<string, string> = {
  BALANCED: '#34d399',
  HIGH: '#a78bfa',
  UNBALANCED: '#fbbf24',
  LOW: '#f87171',
};

export function RecoveryStatusCard({ wellness }: RecoveryStatusCardProps) {
  const readiness = wellness?.trainingReadinessScore ?? 0;
  const bodyBattery = wellness?.bodyBatteryHighest ?? 0;
  const sleepScore = wellness?.sleepScore ?? 0;

  const readinessColor =
    readiness >= 75 ? '#34d399' : readiness >= 50 ? '#60a5fa' : '#f87171';
  const bodyBatteryColor =
    bodyBattery >= 75 ? '#34d399' : bodyBattery >= 50 ? '#fbbf24' : '#f87171';
  const sleepColor =
    sleepScore >= 80 ? '#34d399' : sleepScore >= 60 ? '#fbbf24' : '#f87171';

  const hrvStatus = wellness?.hrvStatus ?? null;
  const hrvValue = wellness?.hrvLastNightMs ?? null;
  const hrvColor = hrvStatus ? HRV_STATUS_COLORS[hrvStatus] : '#475569';

  return (
    <div className="card">
      <h3 className="section-header mb-4">Today&apos;s Status</h3>

      {!wellness ? (
        <div className="text-sm text-text-muted text-center py-4">
          No wellness data for today. Sync Garmin to see status.
        </div>
      ) : (
        <>
          {/* Rings row */}
          <div className="flex items-center justify-around mb-5">
            <CircularRing
              score={readiness}
              label="Readiness"
              color={readinessColor}
            />
            <CircularRing
              score={bodyBattery}
              label="Body Battery"
              color={bodyBatteryColor}
            />
            <CircularRing
              score={sleepScore}
              label="Sleep"
              color={sleepColor}
            />
          </div>

          {/* HRV Status */}
          {hrvValue && (
            <div
              className="flex items-center justify-between p-3 rounded-xl border mb-3"
              style={{
                backgroundColor: `${hrvColor}08`,
                borderColor: `${hrvColor}25`,
              }}
            >
              <div>
                <div className="text-xs text-text-muted">HRV Last Night</div>
                <div className="text-xl font-bold mt-0.5" style={{ color: hrvColor }}>
                  {Math.round(hrvValue)}{' '}
                  <span className="text-xs font-normal text-text-muted">ms</span>
                </div>
              </div>
              {hrvStatus && (
                <span
                  className="badge"
                  style={{
                    color: hrvColor,
                    backgroundColor: `${hrvColor}15`,
                    border: `1px solid ${hrvColor}30`,
                  }}
                >
                  {hrvStatus}
                </span>
              )}
            </div>
          )}

          {/* Stress */}
          {wellness.avgStressLevel !== null && wellness.avgStressLevel !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Avg Stress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${wellness.avgStressLevel}%`,
                      backgroundColor:
                        wellness.avgStressLevel < 30
                          ? '#34d399'
                          : wellness.avgStressLevel < 60
                            ? '#fbbf24'
                            : '#f87171',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-text-secondary">
                  {wellness.avgStressLevel}
                </span>
              </div>
            </div>
          )}

          {/* Steps */}
          {wellness.totalSteps && wellness.dailyStepGoal && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-muted">Steps</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-blue"
                    style={{
                      width: `${Math.min(100, (wellness.totalSteps / wellness.dailyStepGoal) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-text-secondary">
                  {(wellness.totalSteps / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
