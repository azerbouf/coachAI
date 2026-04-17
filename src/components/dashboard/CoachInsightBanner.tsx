'use client';

import { Sparkles, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DailyTip } from '@/types/coach';

interface CoachInsightBannerProps {
  tip: DailyTip | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  training: '🏃',
  recovery: '😴',
  nutrition: '🥗',
  mindset: '🧠',
  technique: '⚙️',
};

export function CoachInsightBanner({ tip }: CoachInsightBannerProps) {
  if (!tip) {
    return (
      <div
        className="card border-l-2 animate-pulse"
        style={{ borderLeftColor: '#a78bfa' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const categoryIcon = CATEGORY_ICONS[tip.category] ?? '💡';

  return (
    <div
      className="card border-l-2 animate-slide-up"
      style={{ borderLeftColor: '#a78bfa' }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center">
          <span className="text-base">{categoryIcon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {tip.headline}
            </h3>
            <Badge
              variant="outline"
              className="text-[9px] font-semibold uppercase tracking-wide gap-0.5 px-1.5 py-0"
              style={{ color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </Badge>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {tip.tip}
          </p>
          {tip.actionItem && (
            <div className="mt-2 flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-accent-yellow flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-yellow">
                {tip.actionItem}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
