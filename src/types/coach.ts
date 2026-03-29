export type AnalysisType = 'activity' | 'daily_tip' | 'weekly_summary';

export type InsightCategory =
  | 'performance'
  | 'technique'
  | 'recovery'
  | 'nutrition'
  | 'training_load'
  | 'pacing';

export type InsightPriority = 'high' | 'medium' | 'low';

export interface CoachInsight {
  category: InsightCategory;
  title: string;
  detail: string;
  priority: InsightPriority;
  emoji?: string;
}

export interface RunAnalysis {
  headline: string;
  summary: string;
  overallRating: 'excellent' | 'good' | 'average' | 'below_average';
  ratingScore: number; // 0-100
  performanceNotes: CoachInsight[];
  techniqueNotes: CoachInsight[];
  recommendations: {
    title: string;
    detail: string;
    priority: InsightPriority;
  }[];
  nextWorkoutAdvice: string;
  contextualFactors: string[];
}

export interface DailyTip {
  headline: string;
  tip: string;
  category: 'training' | 'recovery' | 'nutrition' | 'mindset' | 'technique';
  actionItem: string;
}

export interface WeeklySummary {
  headline: string;
  weekSummary: string;
  totalDistanceKm: number;
  totalDurationHours: number;
  numberOfRuns: number;
  keyWorkoutHighlight: string;
  trainingLoadAssessment: 'too_easy' | 'optimal' | 'too_hard';
  nextWeekFocus: string;
  recommendations: string[];
}

export interface CoachAnalysis {
  id: string;
  userId: string;
  analysisType: AnalysisType;
  activityId?: string;
  analysisDate?: string;
  weekStartDate?: string;
  headline?: string;
  summary?: string;
  fullAnalysis: RunAnalysis | DailyTip | WeeklySummary | null;
  modelUsed?: string;
  tokensUsed?: number;
  cachedUntil?: string;
  createdAt: string;
  updatedAt: string;
}
