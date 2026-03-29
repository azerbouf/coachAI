import type { MarathonPlanTemplate, WorkoutType, TrainingPhase } from '@/types/training';
import { addDays, format, parseISO } from 'date-fns';

// Race date: June 17, 2026
// 13 weeks counting back from race day
// Week 1 starts: March 17, 2026

export const MARATHON_PLAN_TEMPLATE: MarathonPlanTemplate[] = [
  // Phase 1 - Recovery & Foundation
  {
    weekNumber: 1,
    phase: 'recovery',
    phaseLabel: 'Recovery & Foundation',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day — recovery is training too' },
      { dayOfWeek: 1, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 2, workoutType: 'EASY', distanceKm: 6, description: 'Easy 6km — conversational pace, heart rate Z1-Z2' },
      { dayOfWeek: 3, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 4, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km + 4×100m strides at 5K effort', notes: 'Strides: 20s fast, 40s walk recovery' },
      { dayOfWeek: 5, workoutType: 'TEMPO', distanceKm: 8, description: 'Tempo 8km — 2km WU, 4km @ lactate threshold, 2km CD', notes: 'Target pace: ~10-15s/km faster than MP' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 12, description: 'Long run 12km — easy effort, keep HR in Z2', notes: 'First long run of the block. No need to push.' },
    ],
  },
  {
    weekNumber: 2,
    phase: 'recovery',
    phaseLabel: 'Recovery & Foundation',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km recovery run — very easy effort' },
      { dayOfWeek: 2, workoutType: 'INTERVALS', distanceKm: 9, description: 'Intervals 9km — 2km WU, 5×600m @ 5K pace, 2km CD', notes: '90s recovery jog between reps' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 6, description: 'Easy 6km — active recovery, stay easy' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'MP', distanceKm: 9, description: 'Marathon Pace 9km — 2km WU, 5km @ goal MP, 2km CD', notes: 'First MP workout. Goal MP should feel controlled.' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 14, description: 'Long run 14km — easy effort, last 2km at MP', notes: 'Practice finishing fast while fatigued' },
    ],
  },

  // Phase 2 - Base Building
  {
    weekNumber: 3,
    phase: 'base',
    phaseLabel: 'Base Building',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km — aerobic base building' },
      { dayOfWeek: 2, workoutType: 'TEMPO', distanceKm: 10, description: 'Tempo 10km — 2km WU, 6km @ LT pace, 2km CD' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km recovery run' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'MP', distanceKm: 10, description: 'Marathon Pace 10km — 2km WU, 6km @ MP, 2km CD' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 17, description: 'Long run 17km — easy effort throughout, Z2', notes: 'Hydrate and practice race nutrition strategy' },
    ],
  },
  {
    weekNumber: 4,
    phase: 'base',
    phaseLabel: 'Base Building',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km + 4×100m strides', notes: 'Strides at end of run' },
      { dayOfWeek: 2, workoutType: 'INTERVALS', distanceKm: 11, description: 'Intervals 11km — 2km WU, 6×800m @ 10K pace, 2km CD', notes: '90s recovery jog between reps' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km recovery run' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'TEMPO', distanceKm: 11, description: 'Tempo 11km — 2km WU, 7km @ LT, 2km CD', notes: 'Build tempo volume progressively' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 19, description: 'Long run 19km — easy with last 3km at MP', notes: 'First time over HM distance this block' },
    ],
  },
  {
    weekNumber: 5,
    phase: 'base',
    phaseLabel: 'Base Building',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km — aerobic development' },
      { dayOfWeek: 2, workoutType: 'MP', distanceKm: 12, description: 'Marathon Pace 12km — 2km WU, 8km @ MP, 2km CD', notes: 'Longest MP segment so far. Lock in the feeling.' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km recovery run' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km + 4×100m strides', notes: 'Pre-long run activation' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 22, description: 'Long run 22km — first 20km easy, last 2km MP', notes: 'Major landmark run. Patience in the first half is key.' },
    ],
  },
  {
    weekNumber: 6,
    phase: 'base',
    phaseLabel: 'Base Building — Recovery Week',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km — cut-back week, very easy' },
      { dayOfWeek: 2, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km + 4×100m strides', notes: 'Keep legs fresh' },
      { dayOfWeek: 3, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 4, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km recovery run' },
      { dayOfWeek: 5, workoutType: 'TEMPO', distanceKm: 8, description: 'Tempo 8km — 2km WU, 4km @ LT, 2km CD', notes: 'Reduced volume, maintain quality' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 15, description: 'Long run 15km — easy, recovery week', notes: 'Reduced long run. Use this week to absorb previous block.' },
    ],
  },

  // Phase 3 - Marathon Specific
  {
    weekNumber: 7,
    phase: 'marathon_specific',
    phaseLabel: 'Marathon Specific',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km — back to business' },
      { dayOfWeek: 2, workoutType: 'MP', distanceKm: 13, description: 'Marathon Pace 13km — 2km WU, 9km @ MP, 2km CD', notes: 'The MP blocks get longer. Own this pace.' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km recovery run' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'TEMPO', distanceKm: 10, description: 'Tempo 10km — 2km WU, 6km @ LT, 2km CD' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 24, description: 'Long run 24km — 20km easy, 4km at MP', notes: 'Race-specific simulation begins. Nail the MP finish.' },
    ],
  },
  {
    weekNumber: 8,
    phase: 'marathon_specific',
    phaseLabel: 'Marathon Specific',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km + 4×100m strides' },
      { dayOfWeek: 2, workoutType: 'INTERVALS', distanceKm: 11, description: 'Intervals 11km — 2km WU, 5×1km @ 10K pace, 2km CD', notes: '2min recovery jog between reps. Hard session.' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km — flush out the legs' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km — pre-long run activation' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 27, description: 'Long run 27km — 22km easy, 5km at MP', notes: 'Longest run so far. Pace discipline is everything.' },
    ],
  },
  {
    weekNumber: 9,
    phase: 'marathon_specific',
    phaseLabel: 'Marathon Specific',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km + 4×100m strides' },
      { dayOfWeek: 2, workoutType: 'TEMPO', distanceKm: 12, description: 'Tempo 12km — 2km WU, 8km @ LT, 2km CD', notes: 'Peak tempo session of the block' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'EASY', distanceKm: 6, description: 'Easy 6km shakeout — light and easy' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 28, description: 'Long run 28km — 22km easy, 6km at MP', notes: 'Peak simulation run. This is the confidence builder.' },
    ],
  },
  {
    weekNumber: 10,
    phase: 'marathon_specific',
    phaseLabel: 'Marathon Specific — Peak Week',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 10, description: 'Easy 10km — build into peak week' },
      { dayOfWeek: 2, workoutType: 'MP', distanceKm: 12, description: 'Marathon Pace 12km — 2km WU, 8km @ MP, 2km CD', notes: 'Last major MP session before taper begins' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'SHAKEOUT', distanceKm: 5, description: 'Easy 5km shakeout — loosen the legs' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 30, description: 'PEAK LONG RUN — 30km: 23km easy, 7km at MP', notes: 'THE peak run. This is your biggest confidence booster. Celebrate it.' },
    ],
  },

  // Phase 4 - Taper
  {
    weekNumber: 11,
    phase: 'taper',
    phaseLabel: 'Taper — Begin',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 9, description: 'Easy 9km + 4×100m strides', notes: 'Taper starts — volume drops but intensity maintained' },
      { dayOfWeek: 2, workoutType: 'MP', distanceKm: 10, description: 'Marathon Pace 10km — 2km WU, 6km @ MP, 2km CD' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 7, description: 'Easy 7km' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'EASY', distanceKm: 5, description: 'Easy 5km — trust the taper' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 21, description: 'Long run 21km — easy effort, stay in control', notes: '30% reduction from peak. Your body is storing energy.' },
    ],
  },
  {
    weekNumber: 12,
    phase: 'taper',
    phaseLabel: 'Taper — Deep',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 8, description: 'Easy 8km — feeling fresh? Good. Trust it.' },
      { dayOfWeek: 2, workoutType: 'TEMPO', distanceKm: 8, description: 'Tempo 8km — 2km WU, 4km @ LT, 2km CD', notes: 'Last quality session. Keep it sharp.' },
      { dayOfWeek: 3, workoutType: 'EASY', distanceKm: 6, description: 'Easy 6km' },
      { dayOfWeek: 4, workoutType: 'REST', distanceKm: 0, description: 'Rest day' },
      { dayOfWeek: 5, workoutType: 'EASY', distanceKm: 5, description: 'Easy 5km + 4×100m strides', notes: 'Strides keep the legs sharp' },
      { dayOfWeek: 6, workoutType: 'LONG', distanceKm: 14, description: 'Long run 14km — easy, enjoy the freshness', notes: 'Last long run. Short and sweet. Confidence run only.' },
    ],
  },
  {
    weekNumber: 13,
    phase: 'taper',
    phaseLabel: 'Race Week',
    workouts: [
      { dayOfWeek: 0, workoutType: 'REST', distanceKm: 0, description: 'Rest day — sleep, hydrate, carb load begins' },
      { dayOfWeek: 1, workoutType: 'EASY', distanceKm: 6, description: 'Easy 6km — just getting the legs moving' },
      { dayOfWeek: 2, workoutType: 'EASY', distanceKm: 5, description: 'Easy 5km + 4×100m strides — race simulation', notes: 'Run at race start time if possible' },
      { dayOfWeek: 3, workoutType: 'REST', distanceKm: 0, description: 'REST — prep gear, plan logistics' },
      { dayOfWeek: 4, workoutType: 'EASY', distanceKm: 4, description: 'Easy 4km — final shakeout, legs should feel amazing' },
      { dayOfWeek: 5, workoutType: 'REST', distanceKm: 0, description: 'REST — final preparations, early to bed' },
      { dayOfWeek: 6, workoutType: 'EASY', distanceKm: 3, description: 'Easy 3km — day before race, stay loose', notes: 'Short jog, nothing more' },
    ],
  },
];

// Race week
export const RACE_DAY = {
  date: '2026-06-17',
  description: 'RACE DAY — MARATHON 42.195km',
  notes: 'You have done the work. Now trust your training. Run the race you have prepared for.',
};

export function generatePlanWithDates(startDate: Date = new Date('2026-03-17')): {
  weekNumber: number;
  phase: TrainingPhase;
  phaseLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  totalDistanceKm: number;
  workouts: {
    dayOfWeek: number;
    scheduledDate: string;
    workoutType: WorkoutType;
    distanceKm: number;
    description: string;
    notes?: string;
  }[];
}[] {
  return MARATHON_PLAN_TEMPLATE.map((week, idx) => {
    const weekStart = addDays(startDate, idx * 7);
    const weekEnd = addDays(weekStart, 6);
    const totalDistanceKm = week.workouts.reduce(
      (sum, w) => sum + w.distanceKm,
      0
    );

    const workouts = week.workouts.map((w) => ({
      ...w,
      scheduledDate: format(addDays(weekStart, w.dayOfWeek), 'yyyy-MM-dd'),
    }));

    return {
      weekNumber: week.weekNumber,
      phase: week.phase,
      phaseLabel: week.phaseLabel,
      weekStartDate: format(weekStart, 'yyyy-MM-dd'),
      weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
      totalDistanceKm,
      workouts,
    };
  });
}

export function getCurrentWeek(planWithDates: ReturnType<typeof generatePlanWithDates>): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  for (const week of planWithDates) {
    if (today >= week.weekStartDate && today <= week.weekEndDate) {
      return week.weekNumber;
    }
  }
  // If past the plan, return last week
  if (today > planWithDates[planWithDates.length - 1].weekEndDate) {
    return planWithDates.length;
  }
  // If before the plan, return week 1
  return 1;
}

export function getNextWorkout(planWithDates: ReturnType<typeof generatePlanWithDates>): {
  weekNumber: number;
  dayOfWeek: number;
  scheduledDate: string;
  workoutType: WorkoutType;
  distanceKm: number;
  description: string;
  notes?: string;
} | null {
  const today = format(new Date(), 'yyyy-MM-dd');

  for (const week of planWithDates) {
    for (const workout of week.workouts) {
      if (workout.scheduledDate >= today && workout.workoutType !== 'REST') {
        return { weekNumber: week.weekNumber, ...workout };
      }
    }
  }

  return null;
}
