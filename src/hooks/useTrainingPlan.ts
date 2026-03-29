import { useMemo } from 'react';
import {
  generatePlanWithDates,
  getCurrentWeek,
  getNextWorkout,
} from '@/lib/training-plan/marathon-plan';

export function useTrainingPlan() {
  const plan = useMemo(() => generatePlanWithDates(), []);
  const currentWeek = useMemo(() => getCurrentWeek(plan), [plan]);
  const nextWorkout = useMemo(() => getNextWorkout(plan), [plan]);

  const currentWeekData = plan.find((w) => w.weekNumber === currentWeek);

  return {
    plan,
    currentWeek,
    nextWorkout,
    currentWeekData,
    totalWeeks: plan.length,
  };
}
