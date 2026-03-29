'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDuration } from '@/lib/utils/pace';
import { buildHRZoneArray } from '@/lib/utils/zones';
import type { Activity } from '@/types/activity';

interface HRZoneChartProps {
  hrZones: Activity['hrZones'];
  durationSeconds: number;
  maxHR?: number;
}

export function HRZoneChart({ hrZones, durationSeconds, maxHR = 190 }: HRZoneChartProps) {
  const zones = buildHRZoneArray(hrZones, maxHR);

  const chartData = zones.map((z) => ({
    name: z.label,
    description: z.description ?? '',
    seconds: z.seconds,
    percent: z.percent,
    color: z.color,
    minHR: z.minHR,
    maxHR: z.maxHR,
  }));

  const hasData = zones.some((z) => z.seconds > 0);

  if (!hasData) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-text-muted">
        No HR zone data available
      </div>
    );
  }

  return (
    <div>
      {/* Bar chart */}
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as typeof chartData[0];
                return (
                  <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-card-hover">
                    <div className="font-medium mb-1" style={{ color: d.color }}>
                      {d.name} — {d.description}
                    </div>
                    <div className="text-text-secondary">
                      {d.percent}% · {formatDuration(d.seconds)}
                    </div>
                    <div className="text-text-muted mt-0.5">
                      {d.minHR}–{d.maxHR} bpm
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="percent" radius={[0, 3, 3, 0]} maxBarSize={18}>
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone legend with times */}
      <div className="grid grid-cols-5 gap-1.5">
        {zones.map((zone) => (
          <div
            key={zone.zone}
            className="text-center py-1.5 px-1 rounded-lg text-xs"
            style={{
              backgroundColor: `${zone.color}10`,
              border: `1px solid ${zone.color}25`,
            }}
          >
            <div className="font-semibold" style={{ color: zone.color }}>
              Z{zone.zone}
            </div>
            <div className="text-text-muted text-[9px] mt-0.5">
              {zone.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
