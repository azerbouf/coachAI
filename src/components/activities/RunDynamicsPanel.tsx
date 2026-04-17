'use client';

import { getDynamicsMetrics } from '@/lib/utils/dynamics';
import type { Activity } from '@/types/activity';

interface RunDynamicsPanelProps {
  activity: Activity;
}

function DynamicMetricCard({
  label,
  value,
  unit,
  benchmarkDescription,
  rating,
  color,
  description,
  benchmarkLow,
  benchmarkHigh,
  lowerIsBetter,
}: {
  label: string;
  value: number;
  unit: string;
  benchmarkDescription: string;
  rating: string;
  color: string;
  description: string;
  benchmarkLow: number;
  benchmarkHigh: number;
  lowerIsBetter: boolean;
}) {
  // Calculate position on benchmark bar
  const rangeMin = lowerIsBetter ? benchmarkLow * 0.8 : benchmarkLow * 0.9;
  const rangeMax = lowerIsBetter ? benchmarkHigh * 1.2 : benchmarkHigh * 1.1;
  const position = Math.max(
    2,
    Math.min(98, ((value - rangeMin) / (rangeMax - rangeMin)) * 100)
  );

  const ratingLabel = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    improve: 'Needs Work',
  }[rating] ?? 'N/A';

  return (
    <div className="p-4 border-b border-border last:border-b-0">
      <div className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-text-muted">{unit}</span>
        <span
          className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {ratingLabel}
        </span>
      </div>
      {/* Benchmark bar */}
      <div className="relative h-1 bg-black/5 rounded-full overflow-visible">
        <div
          className="absolute top-0 h-full rounded-full opacity-25"
          style={{
            backgroundColor: '#34d399',
            left: lowerIsBetter ? '0%' : '20%',
            right: lowerIsBetter ? '40%' : '0%',
          }}
        />
        <div
          className="absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface"
          style={{
            left: `${position}%`,
            transform: 'translateX(-50%) translateY(-50%)',
            backgroundColor: color,
          }}
        />
      </div>
      <div className="text-[10px] text-text-muted mt-1.5">{benchmarkDescription}</div>
    </div>
  );
}

export function RunDynamicsPanel({ activity }: RunDynamicsPanelProps) {
  const metrics = getDynamicsMetrics(
    activity.avgCadence ?? null,
    activity.avgVerticalOscillation ?? null,
    activity.avgGroundContactTime ?? null,
    activity.avgVerticalRatio ?? null,
    activity.avgGroundContactBalance ?? null
  );

  if (metrics.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Running dynamics data not available for this activity
      </div>
    );
  }

  return (
    <div className="space-y-0 -mx-1">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {metrics.map(({ key, ...metric }) => (
          <DynamicMetricCard key={key} {...metric} value={metric.value!} />
        ))}
      </div>
    </div>
  );
}
