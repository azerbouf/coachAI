'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import type { Activity } from '@/types/activity';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

interface TrainingLoadCardProps {
  activities: Activity[];
}

function getDailyLoad(activities: Activity[], daysBack: number): { date: string; load: number; label: string }[] {
  const today = new Date();
  return Array.from({ length: daysBack }, (_, i) => {
    const date = subDays(today, daysBack - 1 - i);
    const dayActivities = activities.filter((a) =>
      isSameDay(parseISO(a.startTime), date)
    );
    const load = dayActivities.reduce((sum, a) => sum + (a.trainingLoad ?? 0), 0);
    return {
      date: format(date, 'yyyy-MM-dd'),
      load: Math.round(load),
      label: format(date, 'EEE'),
    };
  });
}

export function TrainingLoadCard({ activities }: TrainingLoadCardProps) {
  const last7Days = getDailyLoad(activities, 7);
  const last14Days = getDailyLoad(activities, 14);

  const thisWeekLoad = last7Days.reduce((s, d) => s + d.load, 0);
  const lastWeekLoad = last14Days.slice(0, 7).reduce((s, d) => s + d.load, 0);

  const changePercent =
    lastWeekLoad > 0
      ? ((thisWeekLoad - lastWeekLoad) / lastWeekLoad) * 100
      : 0;

  const maxLoad = Math.max(...last7Days.map((d) => d.load), 1);

  return (
    <div className="card h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent-orange" />
          <span className="text-sm font-medium text-text-secondary">Training Load</span>
        </div>
        <TrendIndicator
          value={changePercent}
          format={(v) => `${v.toFixed(0)}%`}
          positiveIsGood={changePercent <= 15} // loading more than 15% may not be good
        />
      </div>

      {/* This vs last week */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="stat-value text-xl text-accent-orange">
            {thisWeekLoad.toFixed(0)}
          </div>
          <div className="stat-label">this week</div>
        </div>
        <div>
          <div className="stat-value text-xl text-text-muted">
            {lastWeekLoad.toFixed(0)}
          </div>
          <div className="stat-label">last week</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-24 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                return (
                  <div className="bg-surface border border-border rounded-lg px-2 py-1 text-xs">
                    <span className="text-text-muted">{payload[0].payload.label}: </span>
                    <span className="text-text-primary font-medium">
                      {payload[0].value as number} load
                    </span>
                  </div>
                );
              }}
            />
            <Bar dataKey="load" radius={[3, 3, 0, 0]}>
              {last7Days.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    idx === last7Days.length - 1
                      ? '#fb923c'
                      : entry.load > 0
                        ? '#fb923c60'
                        : '#252840'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
