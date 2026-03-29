import { useQuery } from '@tanstack/react-query';
import type { Activity } from '@/types/activity';

export function useActivity(id: string | null) {
  return useQuery<{ activity: Activity }>({
    queryKey: ['activity', id],
    queryFn: async () => {
      if (!id) throw new Error('No activity ID');
      const res = await fetch(`/api/garmin/activity/${id}`);
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    enabled: !!id,
  });
}
