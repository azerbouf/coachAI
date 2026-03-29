'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyWellness } from '@/types/recovery';

interface SleepScoreChartProps {
  data: DailyWellness[];
}

function getSleepColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#fbbf24';
  return '#f87171';
}

function formatSleepDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SleepScoreChart({ data }: SleepScoreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-text-muted">
        No sleep data available
      </div>
    );
  }

  const chartData = [...data]
    .reverse()
    .slice(0, 14)
    .map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      score: d.sleepScore ?? 0,
      duration: d.sleepDurationSeconds,
      color: getSleepColor(d.sleepScore ?? 0),
    }));

  const avgScore =
    chartData.filter((d) => d.score > 0).length > 0
      ? chartData
          .filter((d) => d.score > 0)
          .reduce((sum, d) => sum + d.score, 0) /
        chartData.filter((d) => d.score > 0).length
      : 0;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold" style={{ color: getSleepColor(avgScore) }}>
          {avgScore.toFixed(0)}
        </span>
        <span className="text-sm text-text-muted">14-day avg sleep score</span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as (typeof chartData)[0];
                return (
                  <div className="bg-surface border border-border rounded-xl px-3 py-2 text-xs shadow-card-hover">
                    <div className="text-text-muted mb-1">{d.date}</div>
                    <div
                      className="font-bold text-base"
                      style={{ color: d.color }}
                    >
                      {d.score}/100
                    </div>
                    {d.duration && (
                      <div className="text-text-muted">
                        {formatSleepDuration(d.duration)}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={80}
              stroke="#34d399"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <ReferenceLine
              y={60}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <Bar dataKey="score" radius={[3, 3, 0, 0]} maxBarSize={24}>
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>≥80 Good</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-yellow" />
          <span>60–79 Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-red" />
          <span>&lt;60 Poor</span>
        </div>
      </div>
    </div>
  );
}
