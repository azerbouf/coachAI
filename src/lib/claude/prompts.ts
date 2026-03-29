import type { Activity } from '@/types/activity';
import type { DailyWellness } from '@/types/recovery';

const COACH_PERSONA = `You are an expert running coach with 20+ years of experience coaching marathon runners from beginners to elites. You specialize in:
- Periodization and training load management
- Running biomechanics and form analysis
- Heart rate-based training
- Race-specific preparation for marathons

Your coaching style is:
- Data-driven: you base all recommendations on actual performance metrics
- Encouraging but honest: you celebrate wins while clearly identifying areas to improve
- Scientifically grounded: you use periodization principles (Lydiard method, 80/20 training, polarized training)
- Pragmatic: recommendations are actionable and specific

RUNNING DYNAMICS BENCHMARKS (elite/recreational):
- Cadence: Elite 180-190 spm, Recreational target 170-185 spm
- Vertical Oscillation: Elite 6-8cm, Recreational target 8-10cm (lower is better)
- Ground Contact Time: Elite <200ms, Recreational target 220-260ms (lower is better)
- Ground Contact Balance: Ideal 50/50%, Within 1% difference is excellent
- Vertical Ratio: Elite 6-8%, Recreational target 8-10% (lower is better)
- Stride Length: Varies by pace, generally 1.2-1.5m at easy pace

HR ZONE GUIDELINES:
- Zone 1 (<60% maxHR): Recovery
- Zone 2 (60-70% maxHR): Aerobic base — target 80% of training here
- Zone 3 (70-80% maxHR): Aerobic tempo — avoid junk miles
- Zone 4 (80-90% maxHR): Lactate threshold — effective but taxing
- Zone 5 (>90% maxHR): VO2max — use sparingly

TRAINING PRINCIPLES:
- 80/20 rule: 80% easy, 20% quality
- Progressive overload: ~10% weekly volume increase max
- Specificity: marathon training requires long runs at marathon pace (MP)
- Recovery: for every 3 weeks build, 1 week recovery`;

export function buildRunAnalysisPrompt(
  activity: Activity,
  previousActivities: Activity[],
  wellness: DailyWellness | null
): string {
  const distanceKm = (activity.distanceMeters / 1000).toFixed(2);
  const paceMinSec = secondsToMinSec(activity.avgPaceSecondsPerKm);
  const durationHHMM = secondsToHHMM(activity.durationSeconds);

  // Build splits summary
  const splitsText =
    activity.splits.length > 0
      ? activity.splits
          .map(
            (s, i) =>
              `km ${i + 1}: ${secondsToMinSec(s.paceSecondsPerKm)}/km, HR ${s.avgHR || 'N/A'}, cadence ${s.cadence || 'N/A'}`
          )
          .join('\n')
      : 'No split data available';

  // HR zones
  const hrZonesText = activity.hrZones
    ? `Zone 1: ${activity.hrZones.zone1Percent}%, Zone 2: ${activity.hrZones.zone2Percent}%, Zone 3: ${activity.hrZones.zone3Percent}%, Zone 4: ${activity.hrZones.zone4Percent}%, Zone 5: ${activity.hrZones.zone5Percent}%`
    : 'HR zone data not available';

  // Running dynamics
  const dynamicsText = [
    activity.avgCadence ? `Cadence: ${activity.avgCadence} spm` : null,
    activity.avgVerticalOscillation
      ? `Vertical Oscillation: ${activity.avgVerticalOscillation}cm`
      : null,
    activity.avgGroundContactTime
      ? `Ground Contact Time: ${activity.avgGroundContactTime}ms`
      : null,
    activity.avgVerticalRatio
      ? `Vertical Ratio: ${activity.avgVerticalRatio}%`
      : null,
    activity.avgGroundContactBalance
      ? `GC Balance: ${activity.avgGroundContactBalance}%`
      : null,
    activity.avgStrideLength
      ? `Stride Length: ${(activity.avgStrideLength / 100).toFixed(2)}m`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  // Recent training context
  const recentRunsText =
    previousActivities.length > 0
      ? previousActivities
          .slice(0, 5)
          .map(
            (a) =>
              `- ${new Date(a.startTime).toLocaleDateString()}: ${(a.distanceMeters / 1000).toFixed(1)}km @ ${secondsToMinSec(a.avgPaceSecondsPerKm)}/km, ${a.trainingLoad ? `Load: ${a.trainingLoad.toFixed(0)}` : ''}`
          )
          .join('\n')
      : 'No recent training history available';

  // Wellness context
  const wellnessText = wellness
    ? `HRV: ${wellness.hrvLastNightMs || 'N/A'}ms (${wellness.hrvStatus || 'N/A'}), Sleep: ${wellness.sleepScore || 'N/A'}/100, Body Battery: ${wellness.bodyBatteryCharged || 'N/A'}, Stress: ${wellness.avgStressLevel || 'N/A'}/100`
    : 'Wellness data not available';

  return `${COACH_PERSONA}

## ACTIVITY TO ANALYZE

**Run Name:** ${activity.name}
**Date:** ${new Date(activity.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Duration:** ${durationHHMM}
**Distance:** ${distanceKm}km
**Average Pace:** ${paceMinSec}/km
**Best Pace:** ${activity.bestPaceSecondsPerKm ? secondsToMinSec(activity.bestPaceSecondsPerKm) : 'N/A'}/km

**Heart Rate:**
- Average HR: ${activity.avgHR || 'N/A'} bpm
- Max HR: ${activity.maxHR || 'N/A'} bpm

**Training Metrics:**
- Aerobic Training Effect: ${activity.trainingEffectAerobic?.toFixed(1) || 'N/A'} (${getTrainingEffectLabel(activity.trainingEffectAerobic)})
- Anaerobic Training Effect: ${activity.trainingEffectAnaerobic?.toFixed(1) || 'N/A'}
- Training Load: ${activity.trainingLoad?.toFixed(0) || 'N/A'}
- Estimated VO2max: ${activity.vo2maxEstimate?.toFixed(1) || 'N/A'}

**Elevation:**
- Gain: ${activity.elevationGainMeters?.toFixed(0) || '0'}m
- Loss: ${activity.elevationLossMeters?.toFixed(0) || '0'}m

**HR Zone Distribution:**
${hrZonesText}

**Running Dynamics:**
${dynamicsText || 'Running dynamics not available'}

**Splits (per km):**
${splitsText}

**Day-of Wellness (if available):**
${wellnessText}

## RECENT TRAINING CONTEXT (last 5 runs):
${recentRunsText}

---

## INSTRUCTIONS

Analyze this run comprehensively and return a JSON object with this exact structure:

{
  "headline": "One compelling sentence summarizing the run (max 80 chars)",
  "summary": "2-3 paragraph coaching summary covering overall execution, key patterns, and immediate takeaway",
  "overallRating": "excellent" | "good" | "average" | "below_average",
  "ratingScore": number (0-100),
  "performanceNotes": [
    {
      "category": "performance" | "technique" | "recovery" | "pacing" | "training_load",
      "title": "Short note title",
      "detail": "Detailed coaching observation with specific data references",
      "priority": "high" | "medium" | "low"
    }
  ],
  "techniqueNotes": [
    {
      "category": "technique",
      "title": "Short technique note",
      "detail": "Specific biomechanical observation with benchmark comparison",
      "priority": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "title": "Actionable recommendation title",
      "detail": "Specific drill, workout, or adjustment to make",
      "priority": "high" | "medium" | "low"
    }
  ],
  "nextWorkoutAdvice": "Specific advice for the next training session based on this run's fatigue and adaptation signals",
  "contextualFactors": ["Factor affecting performance (e.g., 'Warm conditions', 'Post-long run legs', etc.)"]
}

Be specific, reference actual numbers from the data, and provide actionable recommendations. Return ONLY the JSON object, no markdown.`;
}

export function buildDailyTipPrompt(
  recentActivities: Activity[],
  todayWellness: DailyWellness | null,
  currentDate: Date
): string {
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const recentLoads = recentActivities
    .slice(0, 7)
    .map((a) => a.trainingLoad ?? 0);
  const avgLoad =
    recentLoads.length > 0
      ? recentLoads.reduce((a, b) => a + b, 0) / recentLoads.length
      : 0;

  return `${COACH_PERSONA}

## CURRENT CONTEXT

**Today:** ${dayOfWeek}, ${currentDate.toLocaleDateString()}
**Recent Training (last 7 days):**
${
  recentActivities.slice(0, 7).length > 0
    ? recentActivities
        .slice(0, 7)
        .map(
          (a) =>
            `- ${new Date(a.startTime).toLocaleDateString()}: ${(a.distanceMeters / 1000).toFixed(1)}km @ ${secondsToMinSec(a.avgPaceSecondsPerKm)}/km`
        )
        .join('\n')
    : 'No recent training data'
}

**Average Training Load (7 days):** ${avgLoad.toFixed(0)}

**Today's Wellness:**
${
  todayWellness
    ? `HRV: ${todayWellness.hrvLastNightMs || 'N/A'}ms (${todayWellness.hrvStatus || 'N/A'})
Sleep Score: ${todayWellness.sleepScore || 'N/A'}/100
Body Battery: ${todayWellness.bodyBatteryCharged || 'N/A'}/100
Stress: ${todayWellness.avgStressLevel || 'N/A'}/100
Training Readiness: ${todayWellness.trainingReadinessScore || 'N/A'}/100`
    : 'No wellness data available'
}

## INSTRUCTIONS

Generate a daily coaching tip that is relevant to the current context. Return JSON:

{
  "headline": "Short punchy headline (max 60 chars)",
  "tip": "2-3 sentence coaching insight tailored to current training state",
  "category": "training" | "recovery" | "nutrition" | "mindset" | "technique",
  "actionItem": "One specific thing to do or focus on today"
}

Make it feel personal, data-driven, and motivating. Return ONLY the JSON object.`;
}

export function buildWeeklySummaryPrompt(
  weekActivities: Activity[],
  wellnessData: DailyWellness[],
  weekStartDate: Date,
  previousWeekActivities: Activity[]
): string {
  const totalDistanceKm = weekActivities.reduce(
    (sum, a) => sum + a.distanceMeters / 1000,
    0
  );
  const totalDurationSeconds = weekActivities.reduce(
    (sum, a) => sum + a.durationSeconds,
    0
  );
  const totalLoad = weekActivities.reduce(
    (sum, a) => sum + (a.trainingLoad ?? 0),
    0
  );

  const prevTotalKm = previousWeekActivities.reduce(
    (sum, a) => sum + a.distanceMeters / 1000,
    0
  );

  const avgHRV =
    wellnessData.length > 0
      ? wellnessData
          .filter((w) => w.hrvLastNightMs)
          .reduce((sum, w) => sum + (w.hrvLastNightMs ?? 0), 0) /
        wellnessData.filter((w) => w.hrvLastNightMs).length
      : null;

  return `${COACH_PERSONA}

## WEEK SUMMARY DATA

**Week of:** ${weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

**Training Volume:**
- Total Distance: ${totalDistanceKm.toFixed(1)}km
- Total Duration: ${secondsToHHMM(totalDurationSeconds)}
- Number of Runs: ${weekActivities.length}
- Total Training Load: ${totalLoad.toFixed(0)}
- Previous Week Distance: ${prevTotalKm.toFixed(1)}km (${prevTotalKm > 0 ? ((totalDistanceKm / prevTotalKm - 1) * 100).toFixed(0) : 'N/A'}% change)

**Individual Runs:**
${weekActivities
  .map(
    (a) =>
      `- ${new Date(a.startTime).toLocaleDateString()}: ${(a.distanceMeters / 1000).toFixed(1)}km @ ${secondsToMinSec(a.avgPaceSecondsPerKm)}/km, HR: ${a.avgHR || 'N/A'}, Load: ${a.trainingLoad?.toFixed(0) || 'N/A'}`
  )
  .join('\n')}

**Average Weekly Wellness:**
- Avg HRV: ${avgHRV ? avgHRV.toFixed(0) : 'N/A'}ms
- Avg Sleep Score: ${wellnessData.length > 0 ? (wellnessData.reduce((s, w) => s + (w.sleepScore ?? 0), 0) / wellnessData.length).toFixed(0) : 'N/A'}/100

## INSTRUCTIONS

Generate a comprehensive weekly training summary. Return JSON:

{
  "headline": "Compelling week summary headline",
  "weekSummary": "3-4 paragraph review of the week including volume, quality, key workouts, and overall assessment",
  "totalDistanceKm": ${totalDistanceKm.toFixed(1)},
  "totalDurationHours": ${(totalDurationSeconds / 3600).toFixed(1)},
  "numberOfRuns": ${weekActivities.length},
  "keyWorkoutHighlight": "Description of the standout workout this week",
  "trainingLoadAssessment": "too_easy" | "optimal" | "too_hard",
  "nextWeekFocus": "Specific focus and adjustments for next week",
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"]
}

Return ONLY the JSON object.`;
}

// Helpers
function secondsToMinSec(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function secondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function getTrainingEffectLabel(value?: number): string {
  if (!value) return 'Recovery';
  if (value < 1.0) return 'Recovery';
  if (value < 2.0) return 'Base';
  if (value < 3.0) return 'Improving Aerobic Fitness';
  if (value < 4.0) return 'Highly Aerobic';
  return 'Overreaching';
}
