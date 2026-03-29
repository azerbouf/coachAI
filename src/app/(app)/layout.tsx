import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import type { User } from '@supabase/supabase-js';

async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
