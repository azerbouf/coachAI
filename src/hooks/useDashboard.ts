import { useQuery } from '@tanstack/react-query';

export function useDashboard() {
  const activitiesQuery = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: async () => {
      const res = await fetch('/api/garmin/activities?limit=14');
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      return data.activities;
    },
  });

  const dailyTipQuery = useQuery({
    queryKey: ['daily-tip'],
    queryFn: async () => {
      const res = await fetch('/api/coach/daily-tip');
      if (!res.ok) throw new Error('Failed to fetch daily tip');
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    activities: activitiesQuery.data ?? [],
    activitiesLoading: activitiesQuery.isLoading,
    dailyTip: dailyTipQuery.data ?? null,
    dailyTipLoading: dailyTipQuery.isLoading,
    isLoading: activitiesQuery.isLoading || dailyTipQuery.isLoading,
    error: activitiesQuery.error ?? dailyTipQuery.error,
  };
}
