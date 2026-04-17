'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={cn('w-8 h-8 text-text-secondary', className)}
        title="Sync Garmin data"
      >
        <RefreshCw className={cn('w-4 h-4', status === 'syncing' && 'animate-spin')} />
      </Button>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={status === 'syncing'}
        className="w-full text-xs"
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
      </Button>
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
