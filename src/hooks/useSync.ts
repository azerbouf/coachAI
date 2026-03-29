import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string | null;
  activitiesSynced?: number;
  wellnessDaysSynced?: number;
}

export function useSync() {
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: null,
  });

  async function triggerSync(fullSync = false) {
    if (syncState.status === 'syncing') return;

    setSyncState({ status: 'syncing', message: 'Syncing your Garmin data...' });

    try {
      const response = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullSync }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Sync failed');
      }

      setSyncState({
        status: 'success',
        message: `Synced ${data.activitiesSynced} activities and ${data.wellnessDaysSynced} wellness days`,
        activitiesSynced: data.activitiesSynced,
        wellnessDaysSynced: data.wellnessDaysSynced,
      });

      // Invalidate relevant queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-tip'] });

      // Reset after 5 seconds
      setTimeout(() => {
        setSyncState({ status: 'idle', message: null });
      }, 5000);
    } catch (error) {
      setSyncState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
      });

      setTimeout(() => {
        setSyncState({ status: 'idle', message: null });
      }, 8000);
    }
  }

  return { syncState, triggerSync };
}
