export type WorkoutType =
  | 'REST'
  | 'EASY'
  | 'TEMPO'
  | 'MP'
  | 'INTERVALS'
  | 'LONG'
  | 'RACE'
  | 'SHAKEOUT';

export type TrainingPhase =
  | 'recovery'
  | 'base'
  | 'marathon_specific'
  | 'taper';

export interface TrainingWorkout {
  id?: string;
  userId?: string;
  weekId?: string;
  weekNumber: number;
  dayOfWeek: number; // 0=Monday, 6=Sunday
  scheduledDate: string;
  workoutType: WorkoutType;
  distanceKm?: number;
  description: string;
  targetPaceMinPerKm?: number;
  targetHRZone?: number;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  linkedActivityId?: string;
}

export interface TrainingPlanWeek {
  id?: string;
  userId?: string;
  weekNumber: number;
  phase: TrainingPhase;
  phaseLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  totalDistanceKm: number;
  isCurrent: boolean;
  workouts: TrainingWorkout[];
  notes?: string;
}

export interface MarathonPlanTemplate {
  weekNumber: number;
  phase: TrainingPhase;
  phaseLabel: string;
  workouts: {
    dayOfWeek: number; // 0=Monday
    workoutType: WorkoutType;
    distanceKm: number;
    description: string;
    notes?: string;
  }[];
}

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  REST: '#475569',
  EASY: '#34d399',
  TEMPO: '#60a5fa',
  MP: '#fbbf24',
  INTERVALS: '#fb923c',
  LONG: '#a78bfa',
  RACE: '#f87171',
  SHAKEOUT: '#34d399',
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  REST: 'Rest',
  EASY: 'Easy',
  TEMPO: 'Tempo',
  MP: 'Marathon Pace',
  INTERVALS: 'Intervals',
  LONG: 'Long Run',
  RACE: 'Race Day',
  SHAKEOUT: 'Shakeout',
};

export const PHASE_COLORS: Record<TrainingPhase, string> = {
  recovery: '#94a3b8',
  base: '#60a5fa',
  marathon_specific: '#a78bfa',
  taper: '#34d399',
};

export const PHASE_LABELS: Record<TrainingPhase, string> = {
  recovery: 'Recovery & Foundation',
  base: 'Base Building',
  marathon_specific: 'Marathon Specific',
  taper: 'Taper',
};
