import { useQuery } from '@tanstack/react-query';

interface UseActivitiesOptions {
  limit?: number;
  offset?: number;
  type?: string;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const { limit = 20, offset = 0, type } = options;

  return useQuery({
    queryKey: ['activities', { limit, offset, type }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (type && type !== 'all') {
        params.set('type', type);
      }
      const res = await fetch(`/api/garmin/activities?${params}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
  });
}
