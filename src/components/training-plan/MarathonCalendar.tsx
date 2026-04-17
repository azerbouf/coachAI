'use client';

import { useState } from 'react';
import { WorkoutCell } from './WorkoutCell';
import { cn } from '@/lib/utils';
import { PHASE_COLORS, PHASE_LABELS } from '@/types/training';
import { formatWeekRange } from '@/lib/utils/date';
import { format, parseISO } from 'date-fns';
import type { TrainingPhase, WorkoutType } from '@/types/training';

interface WorkoutData {
  dayOfWeek: number;
  scheduledDate: string;
  workoutType: WorkoutType;
  distanceKm: number;
  description: string;
  notes?: string;
  isCompleted?: boolean;
}

interface WeekData {
  weekNumber: number;
  phase: TrainingPhase;
  phaseLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  totalDistanceKm: number;
  workouts: WorkoutData[];
}

interface MarathonCalendarProps {
  weeks: WeekData[];
  currentWeek: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MarathonCalendar({ weeks, currentWeek }: MarathonCalendarProps) {
  const [tooltip, setTooltip] = useState<{
    workout: WorkoutData;
    weekNumber: number;
    x: number;
    y: number;
  } | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Group weeks by phase
  let currentPhase: TrainingPhase | null = null;

  return (
    <div className="relative overflow-x-auto">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className="bg-surface border border-border rounded-xl p-3 shadow-card-hover max-w-xs w-48">
            <div className="font-semibold text-sm text-text-primary mb-1">
              Week {tooltip.weekNumber} — {DAY_LABELS[tooltip.workout.dayOfWeek]}
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              {tooltip.workout.description}
            </div>
            {tooltip.workout.notes && (
              <div className="mt-1.5 text-[11px] text-text-muted border-t border-border pt-1.5">
                {tooltip.workout.notes}
              </div>
            )}
          </div>
        </div>
      )}

      <table className="w-full border-collapse min-w-[700px]">
        {/* Header */}
        <thead>
          <tr>
            <th className="text-left py-2 px-3 w-36">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                Week
              </span>
            </th>
            {DAY_LABELS.map((day) => (
              <th
                key={day}
                className="text-center py-2 px-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {day}
              </th>
            ))}
            <th className="text-right py-2 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {weeks.map((week) => {
            const isCurrentWeek = week.weekNumber === currentWeek;
            const isNewPhase = week.phase !== currentPhase;
            currentPhase = week.phase;
            const phaseColor = PHASE_COLORS[week.phase];

            // Build a map of dayOfWeek → workout
            const workoutByDay: Record<number, WorkoutData> = {};
            week.workouts.forEach((w) => {
              workoutByDay[w.dayOfWeek] = w;
            });

            return (
              <>
                {/* Phase header row */}
                {isNewPhase && (
                  <tr key={`phase-${week.phase}-${week.weekNumber}`}>
                    <td
                      colSpan={9}
                      className="pt-4 pb-1 px-3"
                    >
                      <div
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: phaseColor }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: phaseColor }}
                        >
                          {PHASE_LABELS[week.phase]}
                        </span>
                        <div
                          className="flex-1 h-px opacity-20"
                          style={{ backgroundColor: phaseColor }}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Week row */}
                <tr
                  key={week.weekNumber}
                  className={cn(
                    'border-b border-border/50 transition-colors',
                    isCurrentWeek && 'bg-accent-purple/5'
                  )}
                >
                  {/* Week label */}
                  <td className="py-1.5 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-xs font-bold',
                            isCurrentWeek ? 'text-accent-purple' : 'text-text-secondary'
                          )}
                        >
                          W{week.weekNumber}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-[9px] font-medium text-accent-purple bg-accent-purple/15 px-1.5 py-0.5 rounded-full">
                            NOW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {formatWeekRange(week.weekStartDate, week.weekEndDate)}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const workout = workoutByDay[dayIdx];
                    if (!workout) return (
                      <td key={dayIdx} className="py-1 px-0.5">
                        <div className="w-full min-h-[52px] rounded-lg bg-black/2" />
                      </td>
                    );
                    const isToday = workout.scheduledDate === today;
                    return (
                      <td
                        key={dayIdx}
                        className="py-1 px-0.5 cursor-pointer"
                        onMouseEnter={(e) => {
                          if (workout.workoutType !== 'REST') {
                            setTooltip({
                              workout,
                              weekNumber: week.weekNumber,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onMouseMove={(e) => {
                          if (tooltip) {
                            setTooltip((prev) =>
                              prev
                                ? { ...prev, x: e.clientX, y: e.clientY }
                                : null
                            );
                          }
                        }}
                      >
                        <WorkoutCell
                          workoutType={workout.workoutType}
                          distanceKm={workout.distanceKm}
                          description={workout.description}
                          isCompleted={workout.isCompleted}
                          isToday={isToday}
                          notes={workout.notes}
                        />
                      </td>
                    );
                  })}

                  {/* Total */}
                  <td className="py-1.5 px-3 text-right">
                    <span className="text-sm font-bold text-text-secondary">
                      {week.totalDistanceKm.toFixed(0)}
                      <span className="text-[10px] text-text-muted ml-0.5">km</span>
                    </span>
                  </td>
                </tr>
              </>
            );
          })}

          {/* Race day row */}
          <tr className="border-b border-border/50 bg-red-500/5">
            <td className="py-1.5 px-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-accent-red">RACE</span>
                <span className="text-[10px] text-text-muted">Jun 17</span>
              </div>
            </td>
            {Array.from({ length: 7 }, (_, dayIdx) => (
              <td key={dayIdx} className="py-1 px-0.5">
                {dayIdx === 1 ? ( // Tuesday = race day (Jun 17 is Tuesday)
                  <div
                    className="w-full min-h-[52px] rounded-lg p-1.5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(167,139,250,0.15))',
                      border: '1px solid rgba(248,113,113,0.3)',
                    }}
                  >
                    <div className="text-[9px] font-bold text-accent-red">🏁 RACE DAY</div>
                    <div className="text-[11px] font-semibold text-text-primary">42.195km</div>
                  </div>
                ) : (
                  <div className="w-full min-h-[52px] rounded-lg bg-black/2" />
                )}
              </td>
            ))}
            <td className="py-1.5 px-3 text-right">
              <span className="text-sm font-bold text-accent-red">42.2km</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {Object.entries(PHASE_LABELS).map(([phase, label]) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PHASE_COLORS[phase as TrainingPhase] }}
            />
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
