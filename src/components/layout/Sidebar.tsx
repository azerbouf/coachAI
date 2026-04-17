'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Calendar,
  Heart,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function Sidebar({ user: _user, profile: _profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col bg-surface border-r border-border"
      style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: '#e8622a' }}>
          <Zap className="w-4 h-4 text-white" />
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

    </aside>
  );
}
