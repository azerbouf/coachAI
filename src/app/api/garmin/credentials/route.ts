import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptGarminPassword } from '@/lib/garmin/sync';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const encryptedPassword = await encryptGarminPassword(password);

    const { error } = await supabase
      .from('profiles')
      .update({
        garmin_email: email,
        garmin_credentials_encrypted: encryptedPassword,
        garmin_sync_enabled: true,
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
