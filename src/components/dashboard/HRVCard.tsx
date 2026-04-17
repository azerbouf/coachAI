'use client';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DailyWellness, HRVStatus } from '@/types/recovery';

interface HRVCardProps {
  latest: DailyWellness | null;
  history: DailyWellness[];
}

const STATUS_CONFIG: Record<HRVStatus, { color: string; label: string; bg: string; border: string }> = {
  BALANCED: {
    color: '#34d399',
    label: 'Balanced',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.2)',
  },
  LOW: {
    color: '#f87171',
    label: 'Low',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.2)',
  },
  UNBALANCED: {
    color: '#fbbf24',
    label: 'Unbalanced',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.2)',
  },
  HIGH: {
    color: '#a78bfa',
    label: 'High',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.2)',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HRVCard({ latest, history }: HRVCardProps) {
  const status = latest?.hrvStatus ?? 'BALANCED';
  const config = STATUS_CONFIG[status];
  const currentHRV = latest?.hrvLastNightMs;

  // Build chart data (last 7 days)
  const chartData = history
    .slice(0, 7)
    .reverse()
    .map((d) => ({
      date: formatDate(d.date),
      hrv: d.hrvLastNightMs ?? 0,
    }));

  const avgHRV =
    chartData.length > 0
      ? chartData.reduce((sum, d) => sum + d.hrv, 0) / chartData.length
      : 0;

  return (
    <Card className="h-full">
      <CardContent className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-medium text-muted-foreground">HRV Status</span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
        >
          {config.label}
        </Badge>
      </div>

      {/* HRV value */}
      <div className="mb-4">
        {currentHRV ? (
          <div className="flex items-baseline gap-2">
            <span className="stat-value" style={{ color: config.color }}>
              {Math.round(currentHRV)}
            </span>
            <span className="text-sm text-text-muted">ms last night</span>
          </div>
        ) : (
          <div className="stat-value text-text-muted">N/A</div>
        )}

        {latest?.hrvBaselineLow && latest?.hrvBaselineHigh && (
          <div className="text-xs text-text-muted mt-1">
            Baseline: {Math.round(latest.hrvBaselineLow)}–{Math.round(latest.hrvBaselineHigh)} ms
          </div>
        )}
      </div>

      {/* 7-day sparkline */}
      {chartData.length > 1 && (
        <div className="-mx-1">
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-surface border border-border rounded-lg px-2 py-1 text-xs">
                        <span className="text-text-muted">{payload[0].payload.date}: </span>
                        <span className="text-text-primary font-medium">
                          {Math.round(payload[0].value as number)} ms
                        </span>
                      </div>
                    );
                  }}
                />
                {avgHRV > 0 && (
                  <ReferenceLine
                    y={avgHRV}
                    stroke={config.color}
                    strokeOpacity={0.3}
                    strokeDasharray="3 3"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="hrv"
                  stroke={config.color}
                  strokeWidth={1.5}
                  fill="url(#hrvGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-text-muted px-1">
            <span>{chartData[0]?.date}</span>
            <span>7-day trend</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {!currentHRV && (
        <div className="text-xs text-muted-foreground mt-2">
          Sync Garmin data to see HRV trends
        </div>
      )}
      </CardContent>
    </Card>
  );
}
