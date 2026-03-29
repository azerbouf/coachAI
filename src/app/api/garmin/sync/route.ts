import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncGarminData, decryptGarminPassword } from '@/lib/garmin/sync';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Garmin credentials from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('garmin_email, garmin_credentials_encrypted, garmin_sync_enabled')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.garmin_email || !profile.garmin_credentials_encrypted) {
      return NextResponse.json(
        { error: 'Garmin credentials not configured. Please connect your Garmin account first.' },
        { status: 400 }
      );
    }

    if (!profile.garmin_sync_enabled) {
      return NextResponse.json(
        { error: 'Garmin sync is disabled for this account.' },
        { status: 400 }
      );
    }

    // Decrypt password
    let garminPassword: string;
    try {
      garminPassword = await decryptGarminPassword(
        profile.garmin_credentials_encrypted
      );
    } catch {
      return NextResponse.json(
        { error: 'Failed to decrypt Garmin credentials' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const fullSync = body.fullSync ?? false;

    // Run sync
    const result = await syncGarminData({
      userId: user.id,
      garminEmail: profile.garmin_email,
      garminPassword,
      activitiesLimit: fullSync ? 100 : 20,
      syncWellnessDays: fullSync ? 30 : 7,
      fullSync,
    });

    return NextResponse.json({
      success: true,
      activitiesSynced: result.activitiesSynced,
      wellnessDaysSynced: result.wellnessDaysSynced,
      syncLogId: result.syncLogId,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
