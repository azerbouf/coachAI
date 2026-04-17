'use client';

import Link from 'next/link';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ArrowRight, Heart, Zap, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { getTrainingEffectLabel, getTrainingEffectColor } from '@/lib/utils/zones';
import { formatActivityDate } from '@/lib/utils/date';
import type { Activity } from '@/types/activity';

interface LastRunCardProps {
  activity: Activity;
  coachVerdict?: string;
}

export function LastRunCard({ activity, coachVerdict }: LastRunCardProps) {
  const sparklineData = activity.splits.length > 0
    ? activity.splits.map((s, i) => ({ km: i + 1, pace: s.paceSecondsPerKm }))
    : [];

  const teColor = getTrainingEffectColor(activity.trainingEffectAerobic);
  const teLabel = getTrainingEffectLabel(activity.trainingEffectAerobic);

  return (
    <Link href={`/activities/${activity.id}`} className="block h-full">
      <Card className="h-full transition-all duration-150 hover:shadow-card-hover hover:-translate-y-px cursor-pointer">
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: teColor, backgroundColor: `${teColor}15`, border: `1px solid ${teColor}30` }}
                >
                  {teLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatActivityDate(activity.startTime)}</span>
              </div>
              <h3 className="font-semibold text-foreground truncate text-base leading-tight">
                {activity.name}
              </h3>
            </div>
          </div>

          {/* Main stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted/40 rounded-lg px-3 py-2.5">
              <div className="text-xl font-bold tabular-nums" style={{ color: '#34d399' }}>
                {formatDistance(activity.distanceMeters, 2)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">km</div>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5">
              <div className="text-xl font-bold tabular-nums text-foreground">
                {formatPace(activity.avgPaceSecondsPerKm)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">pace /km</div>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5">
              <div className="text-xl font-bold tabular-nums text-foreground">
                {formatDuration(activity.durationSeconds)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">time</div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground flex-wrap">
            {activity.avgHR && (
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-accent-red" />
                <span>{activity.avgHR} bpm</span>
              </div>
            )}
            {activity.elevationGainMeters && activity.elevationGainMeters > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent-blue" />
                <span>+{activity.elevationGainMeters.toFixed(0)}m</span>
              </div>
            )}
            {activity.calories && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-yellow" />
                <span>{activity.calories} kcal</span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData.length > 1 && (
            <div className="mb-4 -mx-1">
              <div className="h-14">
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
                          <div className="bg-card border border-border rounded-lg px-2 py-1 text-xs shadow-sm">
                            <span className="text-muted-foreground">km {payload[0].payload.km}: </span>
                            <span className="text-foreground font-medium">{formatPace(val)}</span>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="pace" stroke="#60a5fa" strokeWidth={1.5} fill="url(#paceGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Coach verdict */}
          {coachVerdict && (
            <div className="mb-4 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: 'rgba(232,98,42,0.05)', borderColor: 'rgba(232,98,42,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                <span className="font-semibold" style={{ color: '#e8622a' }}>AI Coach: </span>
                {coachVerdict}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#e8622a' }}>
            <ArrowRight className="w-3.5 h-3.5" />
            View full analysis
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
