'use client';

import { getDynamicsMetrics, getDynamicsScore } from '@/lib/utils/dynamics';
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
    <div className="p-3 rounded-xl bg-white/3 border border-border hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs font-medium text-text-secondary">{label}</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold" style={{ color }}>
              {value}
            </span>
            <span className="text-xs text-text-muted">{unit}</span>
          </div>
        </div>
        <span
          className="badge text-[9px]"
          style={{
            color,
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          {ratingLabel}
        </span>
      </div>

      {/* Benchmark gradient bar */}
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-visible mb-2">
        {/* Good zone */}
        <div
          className="absolute top-0 h-full rounded-full opacity-30"
          style={{
            backgroundColor: '#34d399',
            left: lowerIsBetter ? '0%' : '20%',
            right: lowerIsBetter ? '40%' : '0%',
          }}
        />
        {/* Value marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background shadow-sm"
          style={{
            left: `${position}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            backgroundColor: color,
          }}
        />
      </div>

      <div className="text-[10px] text-text-muted">{benchmarkDescription}</div>
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

  const score = getDynamicsScore(metrics);

  if (metrics.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Running dynamics data not available for this activity
      </div>
    );
  }

  const scoreColor =
    score >= 75
      ? '#34d399'
      : score >= 50
        ? '#60a5fa'
        : score >= 25
          ? '#fbbf24'
          : '#f87171';

  return (
    <div>
      {/* Overall score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">
          Based on {metrics.length} metrics
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Form score:</span>
          <span className="text-sm font-bold" style={{ color: scoreColor }}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {metrics.map((metric) => (
          <DynamicMetricCard key={metric.key} {...metric} value={metric.value!} />
        ))}
      </div>
    </div>
  );
}
