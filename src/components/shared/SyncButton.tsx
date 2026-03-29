'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  userId: string;
  onSyncComplete?: (result: { activitiesSynced: number }) => void;
  className?: string;
  compact?: boolean;
}

export function SyncButton({
  userId,
  onSyncComplete,
  className,
  compact = false,
}: SyncButtonProps) {
  const [status, setStatus] = useState<
    'idle' | 'syncing' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    if (status === 'syncing') return;
    setStatus('syncing');
    setMessage(null);

    try {
      const response = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Sync failed');
      }

      setStatus('success');
      setMessage(`Synced ${data.activitiesSynced} activities`);
      onSyncComplete?.(data);

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage(null);
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Sync failed');
      setTimeout(() => {
        setStatus('idle');
        setMessage(null);
      }, 5000);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={cn(
          'p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors',
          status === 'syncing' && 'opacity-50 cursor-not-allowed',
          className
        )}
        title="Sync Garmin data"
      >
        <RefreshCw
          className={cn(
            'w-4 h-4',
            status === 'syncing' && 'animate-spin'
          )}
        />
      </button>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={cn(
          'btn btn-secondary w-full text-xs',
          status === 'syncing' && 'opacity-50 cursor-not-allowed'
        )}
      >
        {status === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-accent-green">Synced!</span>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="w-3.5 h-3.5 text-accent-red" />
            <span className="text-accent-red">Failed</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Garmin
          </>
        )}
      </button>
      {message && (
        <p
          className={cn(
            'text-[10px] text-center',
            status === 'success' ? 'text-accent-green' : 'text-accent-red'
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
