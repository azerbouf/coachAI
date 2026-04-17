'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatPace, formatDuration, formatDistance } from '@/lib/utils/pace';
import { formatActivityDate } from '@/lib/utils/date';
import { getDynamicsMetrics, getDynamicsScore } from '@/lib/utils/dynamics';
import type { Activity } from '@/types/activity';
import type { CoachAnalysis, RunAnalysis } from '@/types/coach';

interface Props {
  activity: Activity;
  analysis: CoachAnalysis | null;
}

// Light-mode rating config
const RATING_CONFIG = {
  excellent:    { color: '#16a34a', label: 'Excellent' },
  good:         { color: '#3b82f6', label: 'Good' },
  average:      { color: '#d97706', label: 'Average' },
  below_average:{ color: '#ef4444', label: 'Below Average' },
};

const RANK_COLORS = ['#ef4444', '#d97706', '#e8622a', '#3b82f6', '#7c3aed'];
const ZONE_COLORS = ['#16a34a', '#3b82f6', '#d97706', '#ea580c', '#dc2626'];
const ZONE_NAMES  = ['Z1 Recovery', 'Z2 Easy', 'Z3 Aerobic', 'Z4 Threshold', 'Z5 Max'];

const C = '#e2e8f0'; // border
const BG = '#ffffff'; // card bg
const T_PRIMARY = '#0f172a';
const T_SECONDARY = '#475569';
const T_MUTED = '#94a3b8';
const GC = 'rgba(0,0,0,0.05)'; // chart grid
const TC = '#94a3b8'; // chart ticks

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.12em', fontWeight: 600, color: T_MUTED, whiteSpace: 'nowrap' as const }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: C }} />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: BG, border: `1px solid ${C}`, borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

export function ReportView({ activity, analysis }: Props) {
  const run = analysis?.fullAnalysis as RunAnalysis | null;
  const cfg = run ? (RATING_CONFIG[run.overallRating] ?? RATING_CONFIG.good) : null;

  // Technique metrics
  const techMetrics = getDynamicsMetrics(
    activity.avgCadence ?? null,
    activity.avgVerticalOscillation ?? null,
    activity.avgGroundContactTime ?? null,
    activity.avgVerticalRatio ?? null,
    activity.avgGroundContactBalance ?? null,
  );
  const techScore = getDynamicsScore(techMetrics);
  const hasTech = techMetrics.length > 0;

  const TECH_RATING_COLOR: Record<string, string> = {
    excellent: '#16a34a', good: '#3b82f6', average: '#d97706', improve: '#ef4444',
  };
  const TECH_RATING_LABEL: Record<string, string> = {
    excellent: 'Optimal', good: 'Good', average: 'Average', improve: 'Improve',
  };

  // Benchmark bar position helper
  function benchPos(value: number, low: number, high: number, lowerIsBetter: boolean): number {
    const rangeMin = lowerIsBetter ? low * 0.75 : low * 0.85;
    const rangeMax = lowerIsBetter ? high * 1.3 : high * 1.15;
    return Math.max(2, Math.min(96, ((value - rangeMin) / (rangeMax - rangeMin)) * 100));
  }

  // Split chart data
  const splitData = (activity.splits ?? []).map((s) => ({
    km: `km ${s.splitNumber}`,
    pace: s.paceSecondsPerKm,
    hr: s.avgHR ?? null,
    elev: s.elevationGain ?? null,
  }));
  const hasSplitChart = splitData.length > 0;

  // HR zones
  const zones = activity.hrZones;
  const zonePercents = [zones.zone1Percent, zones.zone2Percent, zones.zone3Percent, zones.zone4Percent, zones.zone5Percent];
  const zoneSeconds = [zones.zone1Seconds, zones.zone2Seconds, zones.zone3Seconds, zones.zone4Seconds, zones.zone5Seconds];
  const isAlert = run?.overallRating === 'below_average' || (zones.zone5Percent ?? 0) > 15;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', color: T_PRIMARY }}>

      {/* ── HEADER ── */}
      <div style={{
        background: BG,
        borderBottom: `1px solid ${C}`,
        padding: '28px 32px 24px',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          {/* Back + date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Link
              href={`/activities/${activity.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9375rem', color: T_MUTED, textDecoration: 'none' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back to activity
            </Link>
            <span style={{ color: T_MUTED, fontSize: '0.9375rem' }}>{formatActivityDate(activity.startTime)}</span>
          </div>

          {/* Rating badge */}
          {cfg && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`,
              borderRadius: 20, padding: '4px 12px', marginBottom: 10,
              fontSize: '0.75rem', color: cfg.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
              {cfg.label} · {run?.ratingScore}/100
            </div>
          )}

          {/* Headline */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: T_PRIMARY, marginBottom: 6, lineHeight: 1.2 }}>
            {run?.headline ?? activity.name}
          </h1>

          {/* Run meta */}
          <div style={{ color: T_MUTED, fontSize: '0.9375rem', display: 'flex', flexWrap: 'wrap' as const, gap: '0 8px' }}>
            <span>{activity.name}</span>
            <span>·</span>
            <span style={{ color: T_PRIMARY, fontWeight: 600 }}>{formatDistance(activity.distanceMeters, 2)} km</span>
            <span>·</span>
            <span style={{ color: T_PRIMARY, fontWeight: 600 }}>{formatDuration(activity.durationSeconds)}</span>
            <span>·</span>
            <span>Avg pace <span style={{ color: T_PRIMARY, fontWeight: 600 }}>{formatPace(activity.avgPaceSecondsPerKm)}/km</span></span>
            {activity.avgHR && (
              <><span>·</span><span>Avg HR <span style={{ color: '#ef4444', fontWeight: 600 }}>{activity.avgHR} bpm</span></span></>
            )}
          </div>

          {/* Verdict pill */}
          {run?.summary && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14,
              background: `${cfg?.color ?? '#3b82f6'}08`, border: `1px solid ${cfg?.color ?? '#3b82f6'}20`,
              borderRadius: 10, padding: '10px 14px',
              fontSize: '0.9375rem', color: T_SECONDARY, lineHeight: 1.6, maxWidth: 700,
            }}>
              <Sparkles style={{ width: 14, height: 14, color: cfg?.color ?? '#3b82f6', flexShrink: 0, marginTop: 2 }} />
              {run.summary}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column' as const, gap: 32 }}>

        {/* STATS ROW */}
        <div>
          <SectionTitle>Today at a glance</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {[
              { label: 'Distance', value: formatDistance(activity.distanceMeters, 2), unit: 'km', color: '#16a34a', alert: false },
              { label: 'Avg Pace', value: formatPace(activity.avgPaceSecondsPerKm), unit: '/km', color: '#3b82f6', alert: false },
              { label: 'Duration', value: formatDuration(activity.durationSeconds), unit: '', color: T_PRIMARY, alert: false },
              { label: 'Avg HR', value: activity.avgHR ?? '—', unit: 'bpm', color: '#ef4444', alert: isAlert },
              { label: 'Elevation', value: `+${activity.elevationGainMeters?.toFixed(0) ?? '0'}`, unit: 'm', color: '#7c3aed', alert: false },
              { label: 'Calories', value: activity.calories ?? '—', unit: 'kcal', color: '#d97706', alert: false },
            ].map((s) => (
              <div key={s.label} style={{
                background: s.alert ? 'rgba(239,68,68,0.04)' : BG,
                border: `1px solid ${s.alert ? 'rgba(239,68,68,0.2)' : C}`,
                borderRadius: 14, padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: T_MUTED, marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                  {s.value}
                  {s.unit && <span style={{ fontSize: '0.875rem', color: T_MUTED, marginLeft: 3 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SPLIT CHART */}
        {hasSplitChart && (
          <div>
            <SectionTitle>Pace · HR · Elevation per km</SectionTitle>
            <Card>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={splitData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GC} vertical={false} />
                    <XAxis dataKey="km" tick={{ fill: TC, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="hr" domain={['auto','auto']} tick={{ fill: '#ef4444', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <YAxis yAxisId="pace" orientation="right" reversed domain={['auto','auto']} tick={{ fill: '#3b82f6', fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => formatPace(v)} />
                    <YAxis yAxisId="elev" orientation="right" domain={[0,'auto']} tick={{ fill: '#7c3aed', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div style={{ background: BG, border: `1px solid ${C}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <div style={{ color: T_MUTED, marginBottom: 4 }}>{label}</div>
                            {payload.map((p) => (
                              <div key={p.name} style={{ color: p.color as string, marginBottom: 2 }}>
                                {p.name === 'pace' ? `Pace: ${formatPace(p.value as number)}/km` : p.name === 'hr' ? `HR: ${p.value} bpm` : `Elev: +${p.value}m`}
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: TC, paddingTop: 8 }} formatter={(v) => v === 'pace' ? 'Pace' : v === 'hr' ? 'Avg HR' : 'Elev Gain'} />
                    <Bar yAxisId="elev" dataKey="elev" name="elev" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.4)" strokeWidth={1} radius={[3,3,0,0]} />
                    <Line yAxisId="hr" type="monotone" dataKey="hr" name="hr" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', stroke: BG, strokeWidth: 1 }} activeDot={{ r: 5 }} />
                    <Line yAxisId="pace" type="monotone" dataKey="pace" name="pace" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#3b82f6', stroke: BG, strokeWidth: 1 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* PERFORMANCE NOTES */}
        {(run?.performanceNotes?.length ?? 0) > 0 && (
          <div>
            <SectionTitle>{run!.performanceNotes.length} key performance factors — ranked by impact</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {run!.performanceNotes.map((note, i) => {
                const rc = RANK_COLORS[i] ?? '#3b82f6';
                return (
                  <Card key={i}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: `${rc}12`, color: rc, fontSize: '0.78rem', fontWeight: 700, marginBottom: 10 }}>
                      #{i + 1}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: T_PRIMARY, marginBottom: 8 }}>
                      {note.emoji && `${note.emoji} `}{note.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: T_SECONDARY, lineHeight: 1.7 }}>{note.detail}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* HR ZONES */}
        <div>
          <SectionTitle>HR zone distribution</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {ZONE_NAMES.map((name, i) => {
                const pct = zonePercents[i] ?? 0;
                const secs = zoneSeconds[i] ?? 0;
                const mins = Math.floor(secs / 60);
                const color = ZONE_COLORS[i];
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem' }}>
                    <span style={{ width: 90, color: T_MUTED, fontSize: '0.8rem', flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(pct, 0.5)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right' as const, color: pct > 20 ? color : T_MUTED, fontWeight: pct > 20 ? 600 : 400, fontSize: '0.8rem' }}>{pct.toFixed(0)}%</span>
                    <span style={{ width: 44, color: T_MUTED, fontSize: '0.8rem', textAlign: 'right' as const }}>{mins}m</span>
                  </div>
                );
              })}
            </div>
            {(activity.trainingEffectAerobic || activity.trainingLoad) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C}`, fontSize: '0.875rem', color: T_MUTED, lineHeight: 1.6 }}>
                {activity.trainingEffectAerobic != null && (
                  <>Training Effect: <strong style={{ color: '#7c3aed' }}>{activity.trainingEffectAerobic.toFixed(1)} aerobic</strong>&nbsp;·&nbsp;</>
                )}
                {activity.trainingLoad != null && (
                  <>Load: <strong style={{ color: '#e8622a' }}>{activity.trainingLoad.toFixed(0)}</strong></>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ── TECHNIQUE ANALYSIS ── */}
        {hasTech && (
          <div>
            <SectionTitle>Running technique analysis</SectionTitle>

            {/* Score block */}
            <div style={{
              background: BG, border: `1px solid ${C}`, borderRadius: 16,
              padding: '24px 28px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' as const,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {/* Ring */}
              <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="9"
                    strokeDasharray={`${(techScore / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{techScore}</div>
                  <div style={{ fontSize: '0.7rem', color: T_MUTED }}>/100</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: T_PRIMARY, marginBottom: 6 }}>
                  Technique Score: {techScore >= 85 ? 'Excellent' : techScore >= 70 ? 'Good Foundation' : techScore >= 50 ? 'Average — Room to Grow' : 'Needs Work'}
                </div>
                <div style={{ fontSize: '0.9375rem', color: T_SECONDARY, lineHeight: 1.7 }}>
                  Based on {techMetrics.length} running dynamics metrics. {
                    techScore >= 80 ? 'Your running mechanics are highly efficient.' :
                    techScore >= 60 ? 'Solid base with clear areas to improve for better efficiency and injury prevention.' :
                    'Several technique areas need attention — fixing these is free speed.'
                  }
                </div>
              </div>
            </div>

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              {techMetrics.map((m) => {
                const color = TECH_RATING_COLOR[m.rating] ?? '#3b82f6';
                const rLabel = TECH_RATING_LABEL[m.rating] ?? m.rating;
                const borderColor = m.rating === 'excellent' ? '#16a34a' : m.rating === 'good' ? '#3b82f6' : m.rating === 'average' ? '#d97706' : '#ef4444';
                return (
                  <div key={m.key} style={{
                    background: BG, border: `1px solid ${C}`, borderRadius: 14, padding: '16px 18px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    {/* Bottom color bar */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: borderColor, borderRadius: '0 0 14px 14px' }} />
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: T_MUTED, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 700, color: T_PRIMARY, lineHeight: 1, marginBottom: 4 }}>
                      {m.value} <span style={{ fontSize: '0.875rem', color: T_MUTED }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: T_MUTED, marginBottom: 8 }}>
                      Target: {m.benchmarkLow}–{m.benchmarkHigh}
                    </div>
                    <div style={{ display: 'inline-block', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, background: `${color}12`, color }}>
                      {rLabel}
                    </div>

                    {/* Benchmark bar */}
                    <div style={{ marginTop: 10, position: 'relative', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 6 }}>
                      <div style={{
                        position: 'absolute', top: 0, height: '100%', borderRadius: 6,
                        background: `linear-gradient(90deg, ${m.lowerIsBetter ? '#3b82f6' : '#3b82f6'}, #16a34a)`,
                        opacity: 0.2,
                        left: m.lowerIsBetter ? '0%' : '15%',
                        right: m.lowerIsBetter ? '35%' : '0%',
                      }} />
                      <div style={{
                        position: 'absolute', top: '50%', width: 10, height: 10,
                        borderRadius: '50%', border: `2px solid ${BG}`, background: color,
                        left: `${benchPos(m.value!, m.benchmarkLow, m.benchmarkHigh, m.lowerIsBetter)}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Technique notes from AI */}
            {(run?.techniqueNotes?.length ?? 0) > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {run!.techniqueNotes.map((note, i) => (
                  <div key={i} style={{
                    background: BG, border: `1px solid ${C}`, borderLeft: `3px solid #3b82f6`,
                    borderRadius: 12, padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: T_PRIMARY, marginBottom: 6 }}>
                      {note.emoji && `${note.emoji} `}{note.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: T_SECONDARY, lineHeight: 1.7 }}>{note.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {(run?.recommendations?.length ?? 0) > 0 && (
          <div>
            <SectionTitle>Coach prescription</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {run!.recommendations.map((rec, i) => {
                const rc = RANK_COLORS[i] ?? '#3b82f6';
                return (
                  <Card key={i}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: T_MUTED, marginBottom: 8 }}>Priority #{i + 1}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: rc, marginBottom: 10 }}>{rec.title}</div>
                    <div style={{ fontSize: '0.875rem', color: T_SECONDARY, lineHeight: 1.7 }}>{rec.detail}</div>
                    <div style={{ display: 'inline-block', marginTop: 12, background: `${rc}10`, color: rc, borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} priority
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM LINE */}
        {run?.nextWorkoutAdvice && (
          <div>
            <SectionTitle>Bottom line</SectionTitle>
            <div style={{
              background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: 16, padding: '24px 26px',
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: T_MUTED, marginBottom: 10 }}>Next workout</div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: T_PRIMARY, marginBottom: 10 }}>{run.nextWorkoutAdvice}</div>
              {(run.contextualFactors?.length ?? 0) > 0 && (
                <ul style={{ fontSize: '0.9375rem', color: T_SECONDARY, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                  {run.contextualFactors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* No analysis fallback */}
        {!run && (
          <div style={{ textAlign: 'center' as const, padding: '48px 24px', background: BG, borderRadius: 14, border: `1px solid ${C}` }}>
            <Sparkles style={{ width: 32, height: 32, color: '#7c3aed', margin: '0 auto 12px' }} />
            <p style={{ color: T_MUTED, fontSize: '1rem' }}>No AI analysis available for this activity yet.</p>
          </div>
        )}

      </div>
    </div>
  );
}
