'use client';

import { formatPace } from '@/lib/utils/pace';
import { getPaceColor } from '@/lib/utils/pace';
import type { Split } from '@/types/activity';

interface SplitsTableProps {
  splits: Split[];
  avgPace: number;
}

export function SplitsTable({ splits, avgPace }: SplitsTableProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No split data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">
              km
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">
              Pace
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">
              HR
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">
              Elev
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
              Cad
            </th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split, idx) => {
            const paceColor = getPaceColor(split.paceSecondsPerKm, avgPace);
            const isLastSplit = idx === splits.length - 1;
            const isPartialKm =
              split.distanceMeters < 900 && split.distanceMeters > 0;

            return (
              <tr
                key={split.splitNumber}
                className="border-b border-border/50 hover:bg-white/3 transition-colors"
              >
                <td className="py-2 px-3 text-text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-xs font-mono">
                      {split.splitNumber}
                    </span>
                    {isPartialKm && (
                      <span className="text-[10px] text-text-muted">
                        ({(split.distanceMeters / 1000).toFixed(2)}km)
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-semibold font-mono" style={{ color: paceColor }}>
                  {formatPace(split.paceSecondsPerKm)}
                </td>
                <td className="py-2 px-3 text-right text-text-secondary">
                  {split.avgHR ? (
                    <span>{split.avgHR}</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-text-muted text-xs hidden md:table-cell">
                  {split.elevationGain > 0 ? (
                    <span className="text-accent-blue">+{split.elevationGain.toFixed(0)}m</span>
                  ) : split.elevationGain < 0 ? (
                    <span className="text-accent-green">{split.elevationGain.toFixed(0)}m</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 px-3 text-right text-text-muted hidden sm:table-cell">
                  {split.cadence ? split.cadence : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="py-2 px-3 text-xs font-medium text-text-muted">avg</td>
            <td className="py-2 px-3 text-right font-semibold font-mono text-text-primary text-xs">
              {formatPace(avgPace)}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
