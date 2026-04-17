'use client';

import { Gauge } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DailyWellness } from '@/types/recovery';

interface ReadinessCardProps {
  wellness: DailyWellness | null;
}

function CircularProgress({
  score,
  size = 100,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const color =
    score >= 75
      ? '#34d399'
      : score >= 50
        ? '#60a5fa'
        : score >= 25
          ? '#fbbf24'
          : '#f87171';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color }}
      >
        <span className="text-xl font-bold">{score}</span>
        <span className="text-[9px] text-text-muted font-medium uppercase tracking-wider">
          /100
        </span>
      </div>
    </div>
  );
}

interface ReadinessFactor {
  label: string;
  score: number;
  color: string;
}

function getFactors(wellness: DailyWellness): ReadinessFactor[] {
  const factors: ReadinessFactor[] = [];

  // HRV factor
  if (wellness.hrvStatus) {
    const hrvScore =
      wellness.hrvStatus === 'BALANCED' || wellness.hrvStatus === 'HIGH'
        ? 85
        : wellness.hrvStatus === 'UNBALANCED'
          ? 55
          : 30;
    factors.push({
      label: 'HRV',
      score: hrvScore,
      color: hrvScore >= 75 ? '#34d399' : hrvScore >= 50 ? '#fbbf24' : '#f87171',
    });
  }

  // Sleep factor
  if (wellness.sleepScore !== undefined && wellness.sleepScore !== null) {
    factors.push({
      label: 'Sleep',
      score: wellness.sleepScore,
      color:
        wellness.sleepScore >= 75
          ? '#34d399'
          : wellness.sleepScore >= 50
            ? '#fbbf24'
            : '#f87171',
    });
  }

  // Body battery
  if (wellness.bodyBatteryHighest !== undefined && wellness.bodyBatteryHighest !== null) {
    factors.push({
      label: 'Body Battery',
      score: wellness.bodyBatteryHighest,
      color:
        wellness.bodyBatteryHighest >= 75
          ? '#34d399'
          : wellness.bodyBatteryHighest >= 50
            ? '#fbbf24'
            : '#f87171',
    });
  }

  // Stress
  if (wellness.avgStressLevel !== undefined && wellness.avgStressLevel !== null) {
    const stressScore = Math.max(0, 100 - wellness.avgStressLevel);
    factors.push({
      label: 'Stress',
      score: stressScore,
      color: stressScore >= 60 ? '#34d399' : stressScore >= 40 ? '#fbbf24' : '#f87171',
    });
  }

  return factors;
}

function getRecommendation(score: number): string {
  if (score >= 85) return 'Excellent readiness — ideal day for a hard workout or long run.';
  if (score >= 70) return 'Good readiness — you can push today with confidence.';
  if (score >= 55) return 'Moderate readiness — consider an easier effort today.';
  if (score >= 40) return 'Low readiness — prioritize an easy run or rest.';
  return 'Very low readiness — rest or very light activity recommended.';
}

export function ReadinessCard({ wellness }: ReadinessCardProps) {
  const score = wellness?.trainingReadinessScore ?? null;
  const displayScore = score ?? 0;
  const factors = wellness ? getFactors(wellness) : [];
  const recommendation = getRecommendation(displayScore);

  return (
    <Card className="h-full">
      <CardContent className="p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-accent-blue" />
        <span className="text-sm font-medium text-muted-foreground">Training Readiness</span>
      </div>

      <div className="flex items-start gap-4">
        {/* Circular progress */}
        <div className="flex-shrink-0">
          <CircularProgress score={displayScore} size={90} />
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-2">
          {factors.length > 0 ? (
            factors.map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-text-muted">{factor.label}</span>
                  <span className="text-[11px] font-medium" style={{ color: factor.color }}>
                    {factor.score}
                  </span>
                </div>
                <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${factor.score}%`,
                      backgroundColor: factor.color,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-text-muted">
              Sync Garmin data to see readiness factors
            </div>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {wellness ? recommendation : 'No wellness data available. Sync Garmin to see training readiness.'}
        </p>
      </div>
      </CardContent>
    </Card>
  );
}
