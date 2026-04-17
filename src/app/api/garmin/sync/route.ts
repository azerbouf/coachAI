import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncGarminData, decryptGarminPassword } from '@/lib/garmin/sync';
import { GarminConnect } from 'garmin-connect';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('garmin_email, garmin_credentials_encrypted, garmin_oauth1_token_encrypted, garmin_oauth2_token_encrypted, garmin_sync_enabled')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.garmin_sync_enabled) {
      return NextResponse.json({ error: 'Garmin sync is disabled' }, { status: 400 });
    }

    // Prefer OAuth tokens over password login
    if (profile.garmin_oauth1_token_encrypted && profile.garmin_oauth2_token_encrypted) {
      const [oauth1Str, oauth2Str] = await Promise.all([
        decryptGarminPassword(profile.garmin_oauth1_token_encrypted),
        decryptGarminPassword(profile.garmin_oauth2_token_encrypted),
      ]);

      const oauth1Token = JSON.parse(oauth1Str);
      const oauth2Token = JSON.parse(oauth2Str);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (oauth2Token.refresh_token_expires_at && oauth2Token.refresh_token_expires_at < now) {
        return NextResponse.json(
          { error: 'Garmin session expired. Please reconnect in Settings.' },
          { status: 401 }
        );
      }

      // Use token-based auth — no password needed
      const body = await request.json().catch(() => ({}));
      const fullSync = body.fullSync ?? false;

      const result = await syncGarminData({
        userId: user.id,
        garminEmail: profile.garmin_email,
        garminPassword: '', // not needed when using tokens
        activitiesLimit: fullSync ? 100 : 20,
        syncWellnessDays: fullSync ? 30 : 7,
        fullSync,
        oauth1Token,
        oauth2Token,
      });

      return NextResponse.json({
        success: true,
        activitiesSynced: result.activitiesSynced,
        wellnessDaysSynced: result.wellnessDaysSynced,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    }

    // Fallback: password login (no MFA accounts)
    if (!profile.garmin_email || !profile.garmin_credentials_encrypted) {
      return NextResponse.json(
        { error: 'Garmin not connected. Please go to Settings and connect your Garmin account.' },
        { status: 400 }
      );
    }

    const garminPassword = await decryptGarminPassword(profile.garmin_credentials_encrypted);
    const body = await request.json().catch(() => ({}));
    const fullSync = body.fullSync ?? false;

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
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
