'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from '@/types/training';
import { formatCalendarDate } from '@/lib/utils/date';
import type { TrainingWorkout } from '@/types/training';

interface UpcomingWorkoutCardProps {
  workout: TrainingWorkout | null;
}

export function UpcomingWorkoutCard({ workout }: UpcomingWorkoutCardProps) {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleComplete() {
    if (!workout?.id || completing) return;
    setCompleting(true);
    try {
      const response = await fetch(`/api/training/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId: workout.id }),
      });
      if (response.ok) setCompleted(true);
    } catch {
      // handle error silently
    } finally {
      setCompleting(false);
    }
  }

  if (!workout) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center text-center py-8">
          <Calendar className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No upcoming workouts</p>
          <p className="text-xs text-muted-foreground mt-1">Training plan not yet initialized</p>
        </CardContent>
      </Card>
    );
  }

  const color = WORKOUT_TYPE_COLORS[workout.workoutType];
  const label = WORKOUT_TYPE_LABELS[workout.workoutType];
  const isRest = workout.workoutType === 'REST';

  return (
    <Card className="h-full" style={{ borderColor: `${color}25` }}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Next Workout</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            {label}
          </Badge>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground mb-3">
          {formatCalendarDate(workout.scheduledDate)} · Week {workout.weekNumber}
        </div>

        {/* Distance */}
        {!isRest && workout.distanceKm > 0 && (
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold tabular-nums" style={{ color }}>
              {workout.distanceKm}
            </span>
            <span className="text-sm text-muted-foreground">km</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {workout.description}
        </p>

        {/* Notes */}
        {workout.notes && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-3 border border-border">
            {workout.notes}
          </p>
        )}

        {/* Complete button */}
        {!isRest && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleComplete}
            disabled={completing || completed || workout.isCompleted}
            className="w-full mt-auto"
            style={completed || workout.isCompleted ? { color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' } : {}}
          >
            {completing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Marking complete...</>
            ) : completed || workout.isCompleted ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Completed</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5" />Mark Complete</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
