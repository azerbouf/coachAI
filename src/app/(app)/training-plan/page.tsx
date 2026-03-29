import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MarathonCalendar } from '@/components/training-plan/MarathonCalendar';
import { generatePlanWithDates, getCurrentWeek, RACE_DAY } from '@/lib/training-plan/marathon-plan';
import { format, differenceInDays, parseISO } from 'date-fns';

export const metadata: Metadata = {
  title: 'Training Plan',
};

export default async function TrainingPlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const plan = generatePlanWithDates();
  const currentWeek = getCurrentWeek(plan);
  const today = new Date();
  const raceDate = parseISO(RACE_DAY.date);
  const daysToRace = differenceInDays(raceDate, today);

  // Total planned distance
  const totalPlannedKm = plan.reduce((sum, w) => sum + w.totalDistanceKm, 0) + 42.195;

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Training Plan</h1>
          <p className="text-sm text-text-muted mt-0.5">
            13-week marathon build to June 17, 2026
          </p>
        </div>

        {/* Race countdown */}
        <div
          className="flex-shrink-0 text-center px-5 py-3 rounded-xl border"
          style={{
            backgroundColor: 'rgba(248,113,113,0.08)',
            borderColor: 'rgba(248,113,113,0.2)',
          }}
        >
          <div className="text-2xl font-bold text-accent-red">{Math.max(0, daysToRace)}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">days to race</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-xl font-bold text-accent-purple">{currentWeek}</div>
          <div className="stat-label mt-0.5">current week</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold text-accent-blue">13</div>
          <div className="stat-label mt-0.5">total weeks</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold text-accent-green">{totalPlannedKm.toFixed(0)}</div>
          <div className="stat-label mt-0.5">km planned</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold text-accent-orange">30</div>
          <div className="stat-label mt-0.5">peak km week 10</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        <h2 className="section-header mb-4">Full Training Schedule</h2>
        <MarathonCalendar weeks={plan} currentWeek={currentWeek} />
      </div>

      {/* Phase breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            phase: 'Recovery & Foundation',
            weeks: '1–2',
            color: '#94a3b8',
            description: 'Rebuild aerobic base, easy running, light quality work',
          },
          {
            phase: 'Base Building',
            weeks: '3–6',
            color: '#60a5fa',
            description: 'Progressive volume increase, introduce MP runs, HM distance',
          },
          {
            phase: 'Marathon Specific',
            weeks: '7–10',
            color: '#a78bfa',
            description: 'Peak volume, long MP simulations, 30km peak long run',
          },
          {
            phase: 'Taper',
            weeks: '11–13',
            color: '#34d399',
            description: 'Volume reduction, maintain quality, race week protocol',
          },
        ].map((p) => (
          <div
            key={p.phase}
            className="card border-t-2"
            style={{ borderTopColor: p.color }}
          >
            <div className="font-semibold text-sm text-text-primary mb-0.5">
              {p.phase}
            </div>
            <div
              className="text-xs font-medium mb-2"
              style={{ color: p.color }}
            >
              Weeks {p.weeks}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
