'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getDynamicsMetrics, getDynamicsScore } from '@/lib/utils/dynamics';
import type { Activity } from '@/types/activity';
import type { CoachAnalysis, RunAnalysis } from '@/types/coach';
import type { DailyWellness } from '@/types/recovery';

// ─── RUN SCORE ───────────────────────────────────────────────────────────────

function RingChart({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="rg" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#34d399" />
          <stop offset="40%"  stopColor="#60a5fa" />
          <stop offset="75%"  stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="13" />
      {/* Arc */}
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="url(#rg)"
        strokeWidth="13"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      {/* Score — centered in ring */}
      <text x="80" y="76" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="800"
        style={{ fill: 'var(--text-primary)', fontFamily: 'inherit' }}>
        {score}
      </text>
      <text x="80" y="97" textAnchor="middle" dominantBaseline="central" fontSize="12"
        style={{ fill: 'var(--text-muted)', fontFamily: 'inherit' }}>
        / 100
      </text>
    </svg>
  );
}

function RunScoreCard({ analysis, activityId }: { analysis: CoachAnalysis | null; activityId: string }) {
  const router = useRouter();
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const run = analysis?.fullAnalysis as RunAnalysis | null;

  const RATING_COLORS: Record<string, string> = {
    excellent: '#16a34a', good: '#2563eb', average: '#d97706', below_average: '#dc2626',
  };
  const color = run ? (RATING_COLORS[run.overallRating] ?? '#2563eb') : '#94a3b8';

  function handleMouseDown(e: React.MouseEvent) {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }
  function handleClick(e: React.MouseEvent) {
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx > 4 || dy > 4) return;
    }
    if (window.getSelection()?.toString()) return;
    router.push(`/activities/${activityId}/report`);
  }

  return (
    <div className="card card-hover h-full flex flex-col gap-4 cursor-pointer"
      onMouseDown={handleMouseDown} onClick={handleClick}>
      <SectionTitle>Run Score</SectionTitle>

      <div className="flex flex-col items-center gap-3 py-2">
        <RingChart score={run?.ratingScore ?? 0} />

        {run ? (
          <>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
              {run.overallRating.replace('_', ' ')}
            </span>
            <p className="text-base font-semibold text-text-primary text-center leading-snug">
              {run.headline}
            </p>
          </>
        ) : (
          <p className="text-sm italic text-text-muted">Analyzing your run...</p>
        )}
      </div>

      <div className="border-t border-border pt-3 mt-auto">
        <div className="flex items-center justify-between text-xs font-medium" style={{ color: '#e8622a' }}>
          Full AI report
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ─── RECOVERY CONTEXT ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-text-muted whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function StatTile({
  label, value, unit, color,
}: {
  label: string; value: string | number | null; unit?: string; color?: string;
}) {
  const hasValue = value !== null && value !== undefined;
  return (
    <div
      className="flex-1 px-3 py-3 rounded-xl min-w-0"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mb-2 truncate">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: hasValue ? (color ?? 'var(--text-primary)') : 'var(--text-muted)' }}
        >
          {value ?? '—'}
        </span>
        {unit && hasValue && <span className="text-xs text-text-muted">{unit}</span>}
      </div>
    </div>
  );
}

function RecoveryContextCard({
  wellness,
  analysis,
}: {
  wellness: DailyWellness | null;
  analysis: CoachAnalysis | null;
}) {
  const run = analysis?.fullAnalysis as RunAnalysis | null;
  const insights = run?.performanceNotes?.slice(0, 3) ?? [];

  const readinessDesc = wellness?.trainingReadinessDescription;
  const statusColor = readinessDesc
    ? /low|fatigue|poor/i.test(readinessDesc) ? '#e8622a'
      : /good|high|excel/i.test(readinessDesc) ? '#16a34a'
      : '#d97706'
    : null;

  // Color-code recovery tiles based on typical thresholds
  const sleepColor = wellness?.sleepScore != null
    ? wellness.sleepScore >= 75 ? '#16a34a' : wellness.sleepScore >= 55 ? '#d97706' : '#dc2626'
    : undefined;
  const hrvColor = wellness?.hrvLastNightMs != null ? '#2563eb' : undefined;
  const batteryColor = wellness?.bodyBatteryHighest != null
    ? wellness.bodyBatteryHighest >= 70 ? '#16a34a' : wellness.bodyBatteryHighest >= 40 ? '#d97706' : '#dc2626'
    : undefined;
  const stressVal = wellness?.avgStressLevel != null ? Math.round(wellness.avgStressLevel) : null;
  const stressColor = stressVal != null
    ? stressVal <= 25 ? '#16a34a' : stressVal <= 50 ? '#d97706' : '#dc2626'
    : undefined;

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Recovery Context</SectionTitle>
        {readinessDesc && statusColor && (
          <span className="text-xs font-semibold capitalize ml-2 flex-shrink-0" style={{ color: statusColor }}>
            {readinessDesc}
          </span>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Sleep Score"  value={wellness?.sleepScore ?? null}        color={sleepColor} />
        <StatTile label="HRV"          value={wellness?.hrvLastNightMs ?? null}    unit="ms" color={hrvColor} />
        <StatTile label="Body Battery" value={wellness?.bodyBatteryHighest ?? null} color={batteryColor} />
        <StatTile label="Avg Stress"   value={stressVal}                           color={stressColor} />
      </div>

      {/* Key insights */}
      {insights.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mb-3 flex items-center gap-3">
            Key Insights <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-3">
            {insights.map((note, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="mt-[7px] w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: note.priority === 'high' ? '#e8622a'
                      : note.priority === 'medium' ? '#d97706'
                      : '#2563eb',
                  }}
                />
                <span className="text-sm text-text-secondary leading-snug">{note.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!wellness && insights.length === 0 && (
        <p className="text-sm italic text-text-muted text-center py-4">
          No recovery data available for this date.
        </p>
      )}
    </div>
  );
}

// ─── TECHNIQUE ANALYSIS ──────────────────────────────────────────────────────

function TechniqueCard({ activity }: { activity: Activity }) {
  const metrics = getDynamicsMetrics(
    activity.avgCadence ?? null,
    activity.avgVerticalOscillation ?? null,
    activity.avgGroundContactTime ?? null,
    activity.avgVerticalRatio ?? null,
    activity.avgGroundContactBalance ?? null,
  );
  const techScore = getDynamicsScore(metrics);

  const RATING_LABEL: Record<string, string> = {
    excellent: 'Optimal', good: 'Good', average: 'Average', improve: 'Improve',
  };
  const RATING_COLOR: Record<string, string> = {
    excellent: '#16a34a', good: '#2563eb', average: '#d97706', improve: '#dc2626',
  };

  // Per-metric improvement tips
  const TIPS: Record<string, { average: string; improve: string }> = {
    cadence: {
      average: 'Try increasing cadence by 5–10% using a metronome app or cadence cue on your watch. Shorter, quicker steps reduce impact and injury risk.',
      improve: 'Your cadence is low — aim for 170+ spm. Run to a beat at 170 bpm, focus on quick light steps rather than long strides.',
    },
    verticalOscillation: {
      average: 'Reduce up-and-down bounce by leaning slightly forward from the ankles and driving elbows back rather than swinging arms across your body.',
      improve: 'High vertical bounce wastes energy. Focus on low, efficient arm swing, keep your gaze forward, and imagine running under a low ceiling.',
    },
    groundContactTime: {
      average: 'Faster foot turnover reduces contact time. Practice barefoot drills or short strides on grass to develop a snappier push-off.',
      improve: 'Long ground contact slows you down significantly. Do bounding drills and stiffness exercises (calf raises, single-leg hops) to build elastic recoil.',
    },
    verticalRatio: {
      average: 'Improve stride length slightly while keeping oscillation low — focus on a powerful glute push-off rather than a higher knee lift.',
      improve: 'High vertical ratio means too much bounce for the distance you cover. Combine cadence work with hip extension drills to lengthen stride efficiently.',
    },
    groundContactBalance: {
      average: 'Slight imbalance detected. Single-leg strength work (single-leg squats, step-ups) on your weaker side can help even things out.',
      improve: 'Significant left/right imbalance increases injury risk. Address with unilateral strength training and check for hip tightness or past injuries on the weaker side.',
    },
  };

  const improvementMetrics = metrics.filter(
    (m) => m.rating === 'average' || m.rating === 'improve'
  );

  const scoreLabel =
    techScore >= 85 ? 'Excellent' :
    techScore >= 70 ? 'Good Foundation' :
    techScore >= 50 ? 'Room to Grow' : 'Needs Work';
  const scoreColor =
    techScore >= 85 ? '#16a34a' :
    techScore >= 70 ? '#3b82f6' :
    techScore >= 50 ? '#d97706' : '#dc2626';
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = (techScore / 100) * circ;

  return (
    <div className="card flex flex-col gap-4">
      <SectionTitle>Running Technique Analysis</SectionTitle>

      {metrics.length === 0 ? (
        <p className="text-sm italic text-text-muted text-center py-6">
          No dynamics data for this activity.
        </p>
      ) : (
        <>
          {/* Score ring block */}
          <div className="flex items-center gap-5 p-4 rounded-xl border border-border" style={{ background: 'var(--surface-2)' }}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={scoreColor} strokeWidth="9"
                  strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div className="text-2xl font-extrabold leading-none" style={{ color: scoreColor }}>{techScore}</div>
                <div className="text-[10px] text-text-muted">/100</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary mb-1">
                {scoreLabel}
              </div>
              <div className="text-xs text-text-secondary leading-relaxed">
                Based on {metrics.length} running dynamics metric{metrics.length > 1 ? 's' : ''}.{' '}
                {techScore >= 80 ? 'Your mechanics are highly efficient.' :
                 techScore >= 60 ? 'Solid base with clear areas to improve.' :
                 'Several technique areas need attention.'}
              </div>
            </div>
          </div>

        <div className="divide-y divide-border">
          {metrics.map((m) => {
            const color = RATING_COLOR[m.rating] ?? '#60a5fa';
            const rLabel = RATING_LABEL[m.rating] ?? m.rating;
            const rangeMin = m.lowerIsBetter ? m.benchmarkLow * 0.8 : m.benchmarkLow * 0.9;
            const rangeMax = m.lowerIsBetter ? m.benchmarkHigh * 1.2 : m.benchmarkHigh * 1.1;
            const pos = Math.max(2, Math.min(98, ((m.value! - rangeMin) / (rangeMax - rangeMin)) * 100));

            return (
              <div key={m.key} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
                    {m.label}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: `${color}18` }}
                  >
                    {rLabel}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-2xl font-bold text-text-primary tabular-nums">{m.value}</span>
                  <span className="text-sm text-text-muted">{m.unit}</span>
                </div>
                {/* Benchmark bar */}
                <div className="text-[10px] text-text-muted flex justify-between mb-1">
                  <span>Benchmark</span>
                  <span>{m.benchmarkLow}–{m.benchmarkHigh}</span>
                </div>
                <div className="relative h-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      backgroundColor: '#16a34a',
                      opacity: 0.15,
                      left: m.lowerIsBetter ? '0%' : '20%',
                      right: m.lowerIsBetter ? '40%' : '0%',
                    }}
                  />
                  <div
                    className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-surface"
                    style={{
                      left: `${pos}%`,
                      transform: 'translateX(-50%) translateY(-50%)',
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

          {/* Improvement tips */}
          {improvementMetrics.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mb-1">
                Areas to improve
              </div>
              {improvementMetrics.map((m) => {
                const tip = TIPS[m.key];
                if (!tip) return null;
                const text = m.rating === 'improve' ? tip.improve : tip.average;
                const color = RATING_COLOR[m.rating];
                return (
                  <div
                    key={m.key}
                    className="flex gap-3 p-3 rounded-lg border"
                    style={{ borderColor: `${color}30`, background: `${color}06` }}
                  >
                    <div
                      className="w-1.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: color, minHeight: 16 }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-text-primary mb-0.5">{m.label}</div>
                      <div className="text-xs text-text-secondary leading-relaxed">{text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── COACH SUGGESTIONS ───────────────────────────────────────────────────────

function CoachSuggestionsCard({
  analysis,
  activityId,
}: {
  analysis: CoachAnalysis | null;
  activityId: string;
}) {
  const router = useRouter();
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const run = analysis?.fullAnalysis as RunAnalysis | null;
  const recs = run?.recommendations ?? [];

  function handleMouseDown(e: React.MouseEvent) {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }
  function handleClick(e: React.MouseEvent) {
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx > 4 || dy > 4) return;
    }
    if (window.getSelection()?.toString()) return;
    router.push(`/activities/${activityId}/report`);
  }

  return (
    <div className="card card-hover h-full flex flex-col gap-5 cursor-pointer"
      onMouseDown={handleMouseDown} onClick={handleClick}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-text-muted whitespace-nowrap">
          Coach Suggestions
        </span>
        <div className="flex-1 h-px bg-border" />
        {run?.ratingScore != null && (
          <span
            className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border flex-shrink-0"
            style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
          >
            Score {run.ratingScore}
          </span>
        )}
      </div>

      {/* Run context box */}
      {run?.summary && (
        <div
          className="px-4 py-3 rounded-xl"
          style={{ backgroundColor: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}
        >
          <div className="text-[10px] uppercase tracking-widest font-bold text-accent-orange mb-1.5">
            Run Context
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{run.summary}</p>
        </div>
      )}

      {/* Numbered suggestions */}
      {recs.length > 0 ? (
        <div className="space-y-2">
          {recs.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-4 py-3 rounded-xl border border-border hover:border-slate-300 transition-colors"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary leading-snug">{rec.title}</p>
                {rec.detail && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#475569' }}>{rec.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-text-muted text-center py-6">
          No suggestions yet — generate an AI report to get coaching feedback.
        </p>
      )}

      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs font-medium" style={{ color: '#e8622a' }}>
          View full AI report
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

interface Props {
  activity: Activity;
  analysis: CoachAnalysis | null;
  wellness: DailyWellness | null;
}

export function ActivityPanels({ activity, analysis, wellness }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
      <RunScoreCard    analysis={analysis}  activityId={activity.id} />
      <RecoveryContextCard wellness={wellness} analysis={analysis} />
      <TechniqueCard   activity={activity} />
      <CoachSuggestionsCard analysis={analysis} activityId={activity.id} />
    </div>
  );
}
