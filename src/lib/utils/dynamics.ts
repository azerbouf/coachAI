export type DynamicsRating = 'excellent' | 'good' | 'average' | 'improve';

export interface DynamicsMetric {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  benchmarkLow: number;
  benchmarkHigh: number;
  lowerIsBetter: boolean;
  rating: DynamicsRating;
  color: string;
  description: string;
  benchmarkDescription: string;
}

export interface DynamicsBenchmarks {
  cadence: { good: [number, number]; excellent: [number, number] };
  verticalOscillation: { good: [number, number]; excellent: [number, number] };
  groundContactTime: { good: [number, number]; excellent: [number, number] };
  verticalRatio: { good: [number, number]; excellent: [number, number] };
  groundContactBalance: { good: [number, number]; excellent: [number, number] };
}

// Benchmarks for recreational marathon runners
const BENCHMARKS: DynamicsBenchmarks = {
  cadence: { good: [170, 185], excellent: [180, 195] },
  verticalOscillation: { good: [8, 10], excellent: [6, 8] }, // lower is better
  groundContactTime: { good: [220, 260], excellent: [180, 220] }, // lower is better
  verticalRatio: { good: [8, 10], excellent: [6, 8] }, // lower is better
  groundContactBalance: { good: [49, 51], excellent: [49.5, 50.5] },
};

function rateDynamic(
  value: number,
  benchmarkGood: [number, number],
  benchmarkExcellent: [number, number],
  lowerIsBetter: boolean
): DynamicsRating {
  if (lowerIsBetter) {
    if (value <= benchmarkExcellent[1]) return 'excellent';
    if (value <= benchmarkGood[1]) return 'good';
    if (value <= benchmarkGood[1] * 1.1) return 'average';
    return 'improve';
  } else {
    if (value >= benchmarkExcellent[0]) return 'excellent';
    if (value >= benchmarkGood[0]) return 'good';
    if (value >= benchmarkGood[0] * 0.9) return 'average';
    return 'improve';
  }
}

function getRatingColor(rating: DynamicsRating): string {
  switch (rating) {
    case 'excellent':
      return '#34d399';
    case 'good':
      return '#60a5fa';
    case 'average':
      return '#fbbf24';
    case 'improve':
      return '#f87171';
  }
}

export function getDynamicsMetrics(
  cadence: number | null,
  verticalOscillation: number | null,
  groundContactTime: number | null,
  verticalRatio: number | null,
  groundContactBalance: number | null
): DynamicsMetric[] {
  const metrics: DynamicsMetric[] = [];

  if (cadence !== null && cadence > 0) {
    const rating = rateDynamic(
      cadence,
      BENCHMARKS.cadence.good,
      BENCHMARKS.cadence.excellent,
      false
    );
    metrics.push({
      key: 'cadence',
      label: 'Cadence',
      unit: 'spm',
      value: cadence,
      benchmarkLow: BENCHMARKS.cadence.good[0],
      benchmarkHigh: BENCHMARKS.cadence.good[1],
      lowerIsBetter: false,
      rating,
      color: getRatingColor(rating),
      description: 'Steps per minute — higher is generally better for efficiency',
      benchmarkDescription: `Target: ${BENCHMARKS.cadence.good[0]}-${BENCHMARKS.cadence.good[1]} spm`,
    });
  }

  if (verticalOscillation !== null && verticalOscillation > 0) {
    const rating = rateDynamic(
      verticalOscillation,
      BENCHMARKS.verticalOscillation.good,
      BENCHMARKS.verticalOscillation.excellent,
      true
    );
    metrics.push({
      key: 'verticalOscillation',
      label: 'Vertical Oscillation',
      unit: 'cm',
      value: verticalOscillation,
      benchmarkLow: BENCHMARKS.verticalOscillation.excellent[0],
      benchmarkHigh: BENCHMARKS.verticalOscillation.good[1],
      lowerIsBetter: true,
      rating,
      color: getRatingColor(rating),
      description: 'Vertical bounce — lower means more energy directed forward',
      benchmarkDescription: `Target: ${BENCHMARKS.verticalOscillation.good[0]}-${BENCHMARKS.verticalOscillation.good[1]} cm`,
    });
  }

  if (groundContactTime !== null && groundContactTime > 0) {
    const rating = rateDynamic(
      groundContactTime,
      BENCHMARKS.groundContactTime.good,
      BENCHMARKS.groundContactTime.excellent,
      true
    );
    metrics.push({
      key: 'groundContactTime',
      label: 'Ground Contact Time',
      unit: 'ms',
      value: Math.round(groundContactTime),
      benchmarkLow: BENCHMARKS.groundContactTime.excellent[0],
      benchmarkHigh: BENCHMARKS.groundContactTime.good[1],
      lowerIsBetter: true,
      rating,
      color: getRatingColor(rating),
      description: 'Time foot spends on the ground — lower = more elastic running',
      benchmarkDescription: `Target: ${BENCHMARKS.groundContactTime.good[0]}-${BENCHMARKS.groundContactTime.good[1]} ms`,
    });
  }

  if (verticalRatio !== null && verticalRatio > 0) {
    const rating = rateDynamic(
      verticalRatio,
      BENCHMARKS.verticalRatio.good,
      BENCHMARKS.verticalRatio.excellent,
      true
    );
    metrics.push({
      key: 'verticalRatio',
      label: 'Vertical Ratio',
      unit: '%',
      value: parseFloat(verticalRatio.toFixed(1)),
      benchmarkLow: BENCHMARKS.verticalRatio.excellent[0],
      benchmarkHigh: BENCHMARKS.verticalRatio.good[1],
      lowerIsBetter: true,
      rating,
      color: getRatingColor(rating),
      description: 'Oscillation to stride length ratio — lower means more efficient',
      benchmarkDescription: `Target: ${BENCHMARKS.verticalRatio.good[0]}-${BENCHMARKS.verticalRatio.good[1]}%`,
    });
  }

  if (groundContactBalance !== null && groundContactBalance > 0) {
    const deviation = Math.abs(50 - groundContactBalance);
    const balanceRating: DynamicsRating =
      deviation <= 0.5
        ? 'excellent'
        : deviation <= 1
          ? 'good'
          : deviation <= 2
            ? 'average'
            : 'improve';
    metrics.push({
      key: 'groundContactBalance',
      label: 'GC Balance',
      unit: '%',
      value: parseFloat(groundContactBalance.toFixed(1)),
      benchmarkLow: 49,
      benchmarkHigh: 51,
      lowerIsBetter: false,
      rating: balanceRating,
      color: getRatingColor(balanceRating),
      description: 'Left/right foot contact balance — ideal is 50/50',
      benchmarkDescription: 'Target: 49-51% (as close to 50% as possible)',
    });
  }

  return metrics;
}

export function getDynamicsScore(metrics: DynamicsMetric[]): number {
  if (metrics.length === 0) return 0;
  const scores: Record<DynamicsRating, number> = {
    excellent: 100,
    good: 75,
    average: 50,
    improve: 25,
  };
  const total = metrics.reduce((sum, m) => sum + scores[m.rating], 0);
  return Math.round(total / metrics.length);
}

/**
 * Get position percentage for benchmark bar (0-100%)
 * given a value and a range [min, max]
 */
export function getBenchmarkPosition(
  value: number,
  rangeMin: number,
  rangeMax: number
): number {
  const range = rangeMax - rangeMin;
  if (range === 0) return 50;
  const pos = ((value - rangeMin) / range) * 100;
  return Math.max(0, Math.min(100, pos));
}
