'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Calendar,
  Heart,
  Zap,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { SyncButton } from '@/components/shared/SyncButton';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  user: User;
  profile: {
    full_name?: string;
    avatar_url?: string;
    garmin_last_sync?: string;
  } | null;
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/activities',
    label: 'Activities',
    icon: Activity,
  },
  {
    href: '/training-plan',
    label: 'Training Plan',
    icon: Calendar,
  },
  {
    href: '/recovery',
    label: 'Recovery',
    icon: Heart,
  },
];

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const displayName =
    profile?.full_name ?? user.email?.split('@')[0] ?? 'Athlete';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className="hidden md:flex flex-col bg-surface border-r border-border"
      style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-purple/20 border border-accent-purple/30">
          <Zap className="w-4 h-4 text-accent-purple" />
        </div>
        <div>
          <div className="font-bold text-text-primary text-sm leading-none">
            CoachAI
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            Marathon Coach
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="section-header px-2 mb-3 text-[10px]">Navigation</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-link', isActive && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border space-y-2">
        <SyncButton userId={user.id} />

        {/* User info */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors group">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-7 h-7 rounded-full border border-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-accent-purple">
                {initials}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {user.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-text-muted hover:text-text-secondary"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
