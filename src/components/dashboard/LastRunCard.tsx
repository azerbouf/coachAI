'use client';

import Link from 'next/link';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ArrowRight, MapPin, Heart, Zap, Clock, Route } from 'lucide-react';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';

interface LastRunCardProps {
  activity: Activity;
  coachVerdict?: string;
}

export function LastRunCard({ activity, coachVerdict }: LastRunCardProps) {
  // Build sparkline data from splits
  const sparklineData = activity.splits.length > 0
    ? activity.splits.map((s, i) => ({
        km: i + 1,
        pace: s.paceSecondsPerKm,
      }))
    : [];

  const avgPace = activity.avgPaceSecondsPerKm;
  const teColor = getTrainingEffectColor(activity.trainingEffectAerobic);
  const teLabel = getTrainingEffectLabel(activity.trainingEffectAerobic);

  return (
    <div className="card card-hover h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="badge text-[10px]"
              style={{ color: teColor, backgroundColor: `${teColor}15`, border: `1px solid ${teColor}30` }}
            >
              {teLabel}
            </span>
          </div>
          <h3 className="font-semibold text-text-primary truncate">
            {activity.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            <span>{formatActivityDate(activity.startTime)}</span>
            {activity.temperatureCelsius && (
              <>
                <span>·</span>
                <span>{activity.temperatureCelsius.toFixed(0)}°C</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="stat-value text-2xl" style={{ color: '#34d399' }}>
            {formatDistance(activity.distanceMeters, 2)}
          </div>
          <div className="stat-label">km</div>
        </div>
        <div>
          <div className="stat-value text-2xl">
            {formatPace(avgPace)}
          </div>
          <div className="stat-label">avg pace</div>
        </div>
        <div>
          <div className="stat-value text-2xl">
            {formatDuration(activity.durationSeconds)}
          </div>
          <div className="stat-label">time</div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {activity.avgHR && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Heart className="w-3.5 h-3.5 text-accent-red" />
            <span>{activity.avgHR} bpm avg</span>
          </div>
        )}
        {activity.elevationGainMeters && activity.elevationGainMeters > 0 && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MapPin className="w-3.5 h-3.5 text-accent-blue" />
            <span>+{activity.elevationGainMeters.toFixed(0)}m</span>
          </div>
        )}
        {activity.calories && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Zap className="w-3.5 h-3.5 text-accent-yellow" />
            <span>{activity.calories} kcal</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData.length > 1 && (
        <div className="mb-4 -mx-1">
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const val = payload[0].value as number;
                    return (
                      <div className="bg-surface border border-border rounded-lg px-2 py-1 text-xs">
                        <span className="text-text-muted">km {payload[0].payload.km}: </span>
                        <span className="text-text-primary font-medium">{formatPace(val)}</span>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pace"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  fill="url(#paceGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Coach verdict */}
      {coachVerdict && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            <span className="text-accent-purple font-medium">Coach: </span>
            {coachVerdict}
          </p>
        </div>
      )}

      {/* Link */}
      <Link
        href={`/activities/${activity.id}`}
        className="flex items-center gap-1.5 text-sm text-accent-purple hover:text-accent-purple/80 transition-colors font-medium group"
      >
        View full analysis
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
