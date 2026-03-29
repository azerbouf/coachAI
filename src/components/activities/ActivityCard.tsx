'use client';

import Link from 'next/link';
import { Clock, Route, Heart, TrendingUp, ChevronRight } from 'lucide-react';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor, getHRStatusColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  coachVerdict?: string;
}

export function ActivityCard({ activity, coachVerdict }: ActivityCardProps) {
  const teColor = getTrainingEffectColor(activity.trainingEffectAerobic);
  const teLabel = getTrainingEffectLabel(activity.trainingEffectAerobic);
  const hrColor = activity.avgHR ? getHRStatusColor(activity.avgHR) : '#475569';

  return (
    <Link href={`/activities/${activity.id}`}>
      <div className="card card-hover group cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Left: activity type icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-border flex items-center justify-center text-lg">
            🏃
          </div>

          {/* Middle: main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-text-primary truncate text-sm">
                  {activity.name}
                </h3>
                <div className="text-xs text-text-muted mt-0.5">
                  {formatActivityDate(activity.startTime)}
                </div>
              </div>

              {/* Training effect */}
              <span
                className="badge flex-shrink-0 text-[9px]"
                style={{
                  color: teColor,
                  backgroundColor: `${teColor}15`,
                  border: `1px solid ${teColor}30`,
                }}
              >
                {teLabel}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Route className="w-3 h-3 text-accent-green" />
                <span className="text-sm font-semibold text-text-primary">
                  {formatDistance(activity.distanceMeters, 2)} km
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                <Clock className="w-3 h-3 text-text-muted" />
                <span>{formatPace(activity.avgPaceSecondsPerKm)}</span>
              </div>

              <div className="text-sm text-text-muted">
                {formatDuration(activity.durationSeconds)}
              </div>

              {activity.avgHR && (
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3 h-3" style={{ color: hrColor }} />
                  <span className="text-sm" style={{ color: hrColor }}>
                    {activity.avgHR} bpm
                  </span>
                </div>
              )}

              {activity.elevationGainMeters && activity.elevationGainMeters > 5 && (
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{activity.elevationGainMeters.toFixed(0)}m</span>
                </div>
              )}
            </div>

            {/* Coach verdict */}
            {coachVerdict && (
              <div className="mt-2 text-xs text-text-muted line-clamp-1">
                <span className="text-accent-purple font-medium">AI: </span>
                {coachVerdict}
              </div>
            )}
          </div>

          {/* Right: chevron */}
          <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
