'use client';

import { cn } from '@/lib/utils';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from '@/types/training';
import type { WorkoutType } from '@/types/training';

interface WorkoutCellProps {
  workoutType: WorkoutType;
  distanceKm: number;
  description: string;
  isCompleted?: boolean;
  isToday?: boolean;
  notes?: string;
}

export function WorkoutCell({
  workoutType,
  distanceKm,
  description,
  isCompleted = false,
  isToday = false,
  notes,
}: WorkoutCellProps) {
  const color = WORKOUT_TYPE_COLORS[workoutType];
  const label = WORKOUT_TYPE_LABELS[workoutType];
  const isRest = workoutType === 'REST';

  if (isRest) {
    return (
      <div
        className={cn(
          'w-full h-full min-h-[52px] flex items-center justify-center rounded-lg',
          isToday && 'ring-1 ring-accent-purple/50'
        )}
      >
        <span className="text-[10px] text-text-muted font-medium">REST</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full min-h-[52px] rounded-lg p-1.5 relative transition-all',
        isToday && 'ring-1 ring-white/30',
        isCompleted && 'opacity-60'
      )}
      style={{
        backgroundColor: `${color}12`,
        border: `1px solid ${color}25`,
      }}
    >
      {/* Type badge */}
      <div
        className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
        style={{ color }}
      >
        {workoutType === 'RACE' ? '🏁 RACE' : label}
      </div>

      {/* Distance */}
      {distanceKm > 0 && (
        <div className="text-[11px] font-semibold text-text-primary">
          {distanceKm}km
        </div>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
          style={{ backgroundColor: `${color}30` }}
        >
          ✓
        </div>
      )}
    </div>
  );
}
