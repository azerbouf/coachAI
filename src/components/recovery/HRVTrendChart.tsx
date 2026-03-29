'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyWellness } from '@/types/recovery';

interface HRVTrendChartProps {
  data: DailyWellness[];
}

export function HRVTrendChart({ data }: HRVTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-text-muted">
        No HRV data available
      </div>
    );
  }

  const chartData = [...data]
    .reverse()
    .filter((d) => d.hrvLastNightMs)
    .map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      hrv: Math.round(d.hrvLastNightMs!),
      baselineLow: d.hrvBaselineLow ? Math.round(d.hrvBaselineLow) : null,
      baselineHigh: d.hrvBaselineHigh ? Math.round(d.hrvBaselineHigh) : null,
      status: d.hrvStatus,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-text-muted">
        No HRV data available
      </div>
    );
  }

  // Calculate baseline from data
  const allBaselinesLow = chartData
    .map((d) => d.baselineLow)
    .filter(Boolean) as number[];
  const allBaselinesHigh = chartData
    .map((d) => d.baselineHigh)
    .filter(Boolean) as number[];
  const avgBaselineLow =
    allBaselinesLow.length > 0
      ? allBaselinesLow.reduce((a, b) => a + b, 0) / allBaselinesLow.length
      : null;
  const avgBaselineHigh =
    allBaselinesHigh.length > 0
      ? allBaselinesHigh.reduce((a, b) => a + b, 0) / allBaselinesHigh.length
      : null;

  const latest = chartData[chartData.length - 1];
  const latestColor =
    latest.status === 'BALANCED' || latest.status === 'HIGH'
      ? '#34d399'
      : latest.status === 'UNBALANCED'
        ? '#fbbf24'
        : '#f87171';

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="hrvTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={latestColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={latestColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as (typeof chartData)[0];
              const statusColors: Record<string, string> = {
                BALANCED: '#34d399',
                LOW: '#f87171',
                UNBALANCED: '#fbbf24',
                HIGH: '#a78bfa',
              };
              return (
                <div className="bg-surface border border-border rounded-xl px-3 py-2 text-xs shadow-card-hover">
                  <div className="text-text-muted mb-1">{d.date}</div>
                  <div className="text-lg font-bold" style={{ color: statusColors[d.status ?? 'BALANCED'] }}>
                    {d.hrv} ms
                  </div>
                  {d.status && (
                    <div style={{ color: statusColors[d.status] }} className="text-[10px]">
                      {d.status}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {/* Baseline zone */}
          {avgBaselineLow && avgBaselineHigh && (
            <ReferenceArea
              y1={avgBaselineLow}
              y2={avgBaselineHigh}
              fill="#34d399"
              fillOpacity={0.06}
              strokeOpacity={0}
            />
          )}
          {avgBaselineLow && (
            <ReferenceLine
              y={avgBaselineLow}
              stroke="#34d399"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}
          {avgBaselineHigh && (
            <ReferenceLine
              y={avgBaselineHigh}
              stroke="#34d399"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}
          <Area
            type="monotone"
            dataKey="hrv"
            stroke={latestColor}
            strokeWidth={2}
            fill="url(#hrvTrendGrad)"
            dot={false}
            activeDot={{ r: 4, fill: latestColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
