'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { formatPace } from '@/lib/utils/pace';
import type { Split } from '@/types/activity';

interface PaceChartProps {
  splits: Split[];
  avgPace: number;
}

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: { pace: number; avg: number };
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;

  const deviation = payload.avg - payload.pace;
  const color =
    deviation > 15
      ? '#34d399'
      : deviation > 5
        ? '#86efac'
        : deviation < -15
          ? '#f87171'
          : deviation < -5
            ? '#fca5a5'
            : '#60a5fa';

  return (
    <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0b0d14" strokeWidth={2} />
  );
}

export function PaceChart({ splits, avgPace }: PaceChartProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-text-muted">
        No split data available
      </div>
    );
  }

  const chartData = splits.map((s) => ({
    km: s.splitNumber,
    pace: s.paceSecondsPerKm,
    avg: avgPace,
  }));

  // Y-axis domain: ±30s around the range
  const paces = splits.map((s) => s.paceSecondsPerKm).filter((p) => p > 0);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const domainMin = Math.max(0, minPace - 30);
  const domainMax = maxPace + 30;

  // Format Y-axis tick (note: higher seconds = slower pace, so we invert)
  const tickFormatter = (value: number) => formatPace(value);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="km"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'km',
              position: 'insideBottomRight',
              offset: 0,
              fill: '#475569',
              fontSize: 11,
            }}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            reversed
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormatter}
            width={50}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as { km: number; pace: number };
              return (
                <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-card-hover">
                  <div className="text-text-muted mb-1">km {d.km}</div>
                  <div className="font-semibold text-text-primary">
                    {formatPace(d.pace)}
                  </div>
                  <div className="text-text-muted mt-0.5">
                    avg: {formatPace(avgPace)}
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={avgPace}
            stroke="#60a5fa"
            strokeDasharray="4 4"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
