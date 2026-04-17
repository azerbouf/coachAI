'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Route, Heart, TrendingUp, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor, getHRStatusColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  coachVerdict?: string;
}

export function ActivityCard({ activity, coachVerdict }: ActivityCardProps) {
  const router = useRouter();
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const teColor = getTrainingEffectColor(activity.trainingEffectAerobic);
  const teLabel = getTrainingEffectLabel(activity.trainingEffectAerobic);
  const hrColor = activity.avgHR ? getHRStatusColor(activity.avgHR) : '#475569';

  function handleMouseDown(e: React.MouseEvent) {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }

  function handleClick(e: React.MouseEvent) {
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx > 4 || dy > 4) return;
    }
    if (window.getSelection()?.toString()) return;
    router.push(`/activities/${activity.id}`);
  }

  return (
    <Card
      className="cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:-translate-y-px"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Left: icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
          🏃
        </div>

        {/* Middle: main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate text-sm">
                {activity.name}
              </h3>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatActivityDate(activity.startTime)}
              </div>
            </div>

            <Badge
              variant="outline"
              className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: teColor, backgroundColor: `${teColor}15`, border: `1px solid ${teColor}30` }}
            >
              {teLabel}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Route className="w-3 h-3 text-accent-green" />
              <span className="text-sm font-semibold text-foreground">
                {formatDistance(activity.distanceMeters, 2)} km
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatPace(activity.avgPaceSecondsPerKm)}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              {formatDuration(activity.durationSeconds)}
            </div>

            {activity.avgHR && (
              <div className="flex items-center gap-1.5">
                <Heart className="w-3 h-3" style={{ color: hrColor }} />
                <span className="text-sm font-medium" style={{ color: hrColor }}>
                  {activity.avgHR} bpm
                </span>
              </div>
            )}

            {activity.elevationGainMeters && activity.elevationGainMeters > 5 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>+{activity.elevationGainMeters.toFixed(0)}m</span>
              </div>
            )}
          </div>

          {/* Coach verdict */}
          {coachVerdict && (
            <div className="mt-2.5 text-sm" style={{ color: '#334155' }}>
              <span className="font-semibold" style={{ color: '#e8622a' }}>AI: </span>
              {coachVerdict}
            </div>
          )}
        </div>

        {/* Right: chevron */}
        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Card>
  );
}
