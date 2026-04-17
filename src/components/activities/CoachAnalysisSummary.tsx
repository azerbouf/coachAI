'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { CoachAnalysis, RunAnalysis } from '@/types/coach';

interface Props {
  activityId: string;
  analysis: CoachAnalysis | null;
}

const RATING_CONFIG = {
  excellent:     { color: '#34d399', label: 'Excellent' },
  good:          { color: '#60a5fa', label: 'Good' },
  average:       { color: '#fbbf24', label: 'Average' },
  below_average: { color: '#f87171', label: 'Below Average' },
};

function RingChart({ score, color }: { score: number; color: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Track */}
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {/* Fill */}
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Score number */}
      <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="700" fill="currentColor" style={{ fill: 'var(--text-primary)', fontFamily: 'inherit' }}>
        {score}
      </text>
      {/* / 100 */}
      <text x="60" y="71" textAnchor="middle" fontSize="11" fill="currentColor" style={{ fill: 'var(--text-muted)', fontFamily: 'inherit' }}>
        / 100
      </text>
    </svg>
  );
}

export function CoachAnalysisSummary({ activityId, analysis }: Props) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent-purple" />
        </div>
        <p className="text-xs text-text-muted max-w-xs">No AI analysis yet for this activity.</p>
        <Link href={`/activities/${activityId}/report`} className="btn btn-primary text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Generate AI Report
        </Link>
      </div>
    );
  }

  const run = analysis.fullAnalysis as RunAnalysis;
  if (!run) return null;

  const cfg = RATING_CONFIG[run.overallRating] ?? RATING_CONFIG.good;
  const topNotes = run.performanceNotes?.slice(0, 3) ?? [];

  return (
    <div className="space-y-5">
      {/* Ring + label */}
      <div className="flex flex-col items-center gap-2 py-2">
        <RingChart score={run.ratingScore} color={cfg.color} />
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
        <p className="text-sm font-medium text-text-primary text-center leading-snug">
          {run.headline}
        </p>
        {run.summary && (
          <p className="text-xs text-text-muted text-center leading-relaxed line-clamp-3 max-w-xs">
            {run.summary}
          </p>
        )}
      </div>

      {/* Key insights */}
      {topNotes.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-3">
            Key Insights
          </div>
          <div className="space-y-2">
            {topNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      note.priority === 'high' ? '#f87171'
                      : note.priority === 'medium' ? '#fbbf24'
                      : '#60a5fa',
                  }}
                />
                <span className="text-sm text-text-secondary leading-snug">{note.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider + link */}
      <div className="pt-1 border-t border-border">
        <Link
          href={`/activities/${activityId}/report`}
          className="flex items-center justify-between w-full text-xs text-accent-purple hover:text-accent-purple/80 transition-colors font-medium group"
        >
          View full AI coaching report
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
