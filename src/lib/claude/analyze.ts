import { getAnthropicClient, CLAUDE_MODEL, CLAUDE_FAST_MODEL } from './client';
import {
  buildRunAnalysisPrompt,
  buildDailyTipPrompt,
  buildWeeklySummaryPrompt,
} from './prompts';
import type { Activity } from '@/types/activity';
import type { DailyWellness } from '@/types/recovery';
import type {
  RunAnalysis,
  DailyTip,
  WeeklySummary,
  CoachAnalysis,
} from '@/types/coach';
import { createClient } from '@supabase/supabase-js';
import { addHours } from 'date-fns';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function analyzeActivity(
  activity: Activity,
  userId: string,
  previousActivities: Activity[] = [],
  wellness: DailyWellness | null = null,
  forceRefresh = false
): Promise<RunAnalysis> {
  const supabase = getServiceSupabase();

  // Check cache first
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('coach_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_type', 'activity')
      .eq('activity_id', activity.id)
      .gt('cached_until', new Date().toISOString())
      .single();

    if (cached?.full_analysis) {
      return cached.full_analysis as RunAnalysis;
    }
  }

  const anthropic = getAnthropicClient();
  const prompt = buildRunAnalysisPrompt(activity, previousActivities, wellness);

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let analysis: RunAnalysis;
  try {
    // Strip markdown code blocks if present
    const text = content.text.replace(/```json\n?|\n?```/g, '').trim();
    analysis = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }

  // Cache the analysis (valid for 30 days)
  const { data: existing } = await supabase
    .from('coach_analyses')
    .select('id')
    .eq('user_id', userId)
    .eq('analysis_type', 'activity')
    .eq('activity_id', activity.id)
    .single();

  if (existing) {
    await supabase
      .from('coach_analyses')
      .update({
        headline: analysis.headline,
        summary: analysis.summary,
        full_analysis: analysis,
        model_used: CLAUDE_MODEL,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        cached_until: addHours(new Date(), 24 * 30).toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('coach_analyses').insert({
      user_id: userId,
      analysis_type: 'activity',
      activity_id: activity.id,
      headline: analysis.headline,
      summary: analysis.summary,
      full_analysis: analysis,
      model_used: CLAUDE_MODEL,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      cached_until: addHours(new Date(), 24 * 30).toISOString(),
    });
  }

  // Mark activity as analyzed
  await supabase
    .from('activities')
    .update({ is_analyzed: true })
    .eq('id', activity.id);

  return analysis;
}

export async function generateDailyTip(
  userId: string,
  recentActivities: Activity[],
  wellness: DailyWellness | null,
  forceRefresh = false
): Promise<DailyTip> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Check cache first (daily tips are cached for 24 hours)
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('coach_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_type', 'daily_tip')
      .eq('analysis_date', today)
      .gt('cached_until', new Date().toISOString())
      .single();

    if (cached?.full_analysis) {
      return cached.full_analysis as DailyTip;
    }
  }

  const anthropic = getAnthropicClient();
  const prompt = buildDailyTipPrompt(recentActivities, wellness, new Date());

  const message = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let tip: DailyTip;
  try {
    const text = content.text.replace(/```json\n?|\n?```/g, '').trim();
    tip = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse Claude daily tip response as JSON');
  }

  // Cache for 24 hours
  const cachedUntil = addHours(new Date(), 24).toISOString();

  // Upsert
  await supabase
    .from('coach_analyses')
    .upsert(
      {
        user_id: userId,
        analysis_type: 'daily_tip',
        analysis_date: today,
        headline: tip.headline,
        summary: tip.tip,
        full_analysis: tip,
        model_used: CLAUDE_FAST_MODEL,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        cached_until: cachedUntil,
      },
      { onConflict: 'user_id,analysis_type,analysis_date' }
    );

  return tip;
}

export async function generateWeeklySummary(
  userId: string,
  weekActivities: Activity[],
  wellnessData: DailyWellness[],
  weekStartDate: Date,
  previousWeekActivities: Activity[],
  forceRefresh = false
): Promise<WeeklySummary> {
  const supabase = getServiceSupabase();
  const weekStart = weekStartDate.toISOString().split('T')[0];

  // Check cache
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('coach_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_type', 'weekly_summary')
      .eq('week_start_date', weekStart)
      .gt('cached_until', new Date().toISOString())
      .single();

    if (cached?.full_analysis) {
      return cached.full_analysis as WeeklySummary;
    }
  }

  const anthropic = getAnthropicClient();
  const prompt = buildWeeklySummaryPrompt(
    weekActivities,
    wellnessData,
    weekStartDate,
    previousWeekActivities
  );

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let summary: WeeklySummary;
  try {
    const text = content.text.replace(/```json\n?|\n?```/g, '').trim();
    summary = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse Claude weekly summary as JSON');
  }

  // Cache for 7 days
  const cachedUntil = addHours(new Date(), 24 * 7).toISOString();

  await supabase
    .from('coach_analyses')
    .upsert(
      {
        user_id: userId,
        analysis_type: 'weekly_summary',
        week_start_date: weekStart,
        headline: summary.headline,
        summary: summary.weekSummary,
        full_analysis: summary,
        model_used: CLAUDE_MODEL,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        cached_until: cachedUntil,
      },
      { onConflict: 'user_id,analysis_type,week_start_date' }
    );

  return summary;
}

export async function getCachedActivityAnalysis(
  activityId: string,
  userId: string
): Promise<CoachAnalysis | null> {
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from('coach_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('analysis_type', 'activity')
    .eq('activity_id', activityId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    analysisType: data.analysis_type,
    activityId: data.activity_id,
    headline: data.headline,
    summary: data.summary,
    fullAnalysis: data.full_analysis,
    modelUsed: data.model_used,
    tokensUsed: data.tokens_used,
    cachedUntil: data.cached_until,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
