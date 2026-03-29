'use client';

import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachAnalysis, RunAnalysis } from '@/types/coach';

interface CoachAnalysisPanelProps {
  activityId: string;
  initialAnalysis: CoachAnalysis | null;
}

const PRIORITY_COLORS = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#60a5fa',
};

const RATING_CONFIG = {
  excellent: { color: '#34d399', label: 'Excellent' },
  good: { color: '#60a5fa', label: 'Good' },
  average: { color: '#fbbf24', label: 'Average' },
  below_average: { color: '#f87171', label: 'Below Average' },
};

export function CoachAnalysisPanel({
  activityId,
  initialAnalysis,
}: CoachAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);

  async function triggerAnalysis() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  // No analysis yet
  if (!analysis && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-accent-purple" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Get AI coaching analysis
        </h3>
        <p className="text-xs text-text-muted mb-4 max-w-xs">
          Claude will analyze your running dynamics, pacing strategy, and
          training effect to provide personalized coaching feedback.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
        <button onClick={triggerAnalysis} className="btn btn-primary text-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Analyze with AI
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 text-accent-purple animate-spin" />
          <span className="text-sm text-text-secondary">
            Analyzing your run...
          </span>
        </div>
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const runAnalysis = analysis.fullAnalysis as RunAnalysis;
  if (!runAnalysis) return null;

  const ratingConfig =
    RATING_CONFIG[runAnalysis.overallRating] ?? RATING_CONFIG.good;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
            <span className="text-xs text-accent-purple font-medium">AI Analysis</span>
          </div>
          <h3 className="text-base font-bold text-text-primary leading-tight">
            {runAnalysis.headline}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="badge"
            style={{
              color: ratingConfig.color,
              backgroundColor: `${ratingConfig.color}15`,
              border: `1px solid ${ratingConfig.color}30`,
            }}
          >
            {ratingConfig.label}
          </span>
          <span className="text-xs font-bold" style={{ color: ratingConfig.color }}>
            {runAnalysis.ratingScore}/100
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {runAnalysis.summary}
      </div>

      {/* Performance notes */}
      {runAnalysis.performanceNotes?.length > 0 && (
        <div>
          <div className="section-header mb-2">Performance</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runAnalysis.performanceNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/3 border border-border"
                style={{ borderLeftColor: PRIORITY_COLORS[note.priority], borderLeftWidth: 2 }}
              >
                <div className="font-medium text-xs text-text-primary mb-0.5">
                  {note.title}
                </div>
                <div className="text-xs text-text-muted leading-relaxed">
                  {note.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique notes */}
      {runAnalysis.techniqueNotes?.length > 0 && (
        <div>
          <div className="section-header mb-2">Running Form</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runAnalysis.techniqueNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/3 border border-border"
                style={{ borderLeftColor: '#a78bfa', borderLeftWidth: 2 }}
              >
                <div className="font-medium text-xs text-text-primary mb-0.5">
                  {note.title}
                </div>
                <div className="text-xs text-text-muted leading-relaxed">
                  {note.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {runAnalysis.recommendations?.length > 0 && (
        <div>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center gap-2 section-header mb-2 hover:text-text-secondary transition-colors"
          >
            Recommendations
            {showRecommendations ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showRecommendations && (
            <div className="space-y-2">
              {runAnalysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-xl bg-white/3 border border-border"
                >
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      color: PRIORITY_COLORS[rec.priority],
                      backgroundColor: `${PRIORITY_COLORS[rec.priority]}20`,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-xs text-text-primary mb-0.5">
                      {rec.title}
                    </div>
                    <div className="text-xs text-text-muted leading-relaxed">
                      {rec.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next workout advice */}
      {runAnalysis.nextWorkoutAdvice && (
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: 'rgba(52,211,153,0.06)',
            borderColor: 'rgba(52,211,153,0.2)',
          }}
        >
          <div className="text-xs font-semibold text-accent-green mb-1 uppercase tracking-wider">
            Next Workout
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {runAnalysis.nextWorkoutAdvice}
          </p>
        </div>
      )}

      {/* Re-analyze */}
      <button
        onClick={triggerAnalysis}
        disabled={loading}
        className="btn btn-secondary w-full text-xs mt-2"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Re-analyze
      </button>
    </div>
  );
}
