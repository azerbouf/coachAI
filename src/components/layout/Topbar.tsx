'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  LogOut,
  Settings,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { formatDashboardDate, formatLastSync } from '@/lib/utils/date';
import { SyncButton } from '@/components/shared/SyncButton';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface TopbarProps {
  user: SupabaseUser;
  profile: {
    full_name?: string;
    avatar_url?: string;
    garmin_last_sync?: string;
  } | null;
}

export function Topbar({ user, profile }: TopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabase = createClient();

  const displayName =
    profile?.full_name ?? user.email?.split('@')[0] ?? 'Athlete';
  const lastSync = profile?.garmin_last_sync ?? null;
  const todayStr = formatDashboardDate();

  async function handleLogout() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Date */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-text-primary">
          {todayStr}
        </div>
        {/* Sync status */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
            lastSync
              ? 'text-accent-green border-accent-green/20 bg-accent-green/10'
              : 'text-text-muted border-border bg-surface'
          )}
        >
          {lastSync ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>{formatLastSync(lastSync)}</span>
        </div>
      </div>

      {/* Right: Sync + User dropdown */}
      <div className="flex items-center gap-2">
        <SyncButton userId={user.id} compact />
        <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/4 transition-colors"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-7 h-7 rounded-full border border-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#e8622a' }}>
              <span className="text-[10px] font-bold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm text-text-secondary hidden sm:block">
            {displayName}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-muted transition-transform',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-border mb-1">
                <div className="text-xs font-medium text-text-primary truncate">
                  {displayName}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {user.email}
                </div>
              </div>

              <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-black/4 transition-colors">
                <User className="w-4 h-4" />
                Profile
              </button>

              <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-black/4 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </Link>

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </header>
  );
}
