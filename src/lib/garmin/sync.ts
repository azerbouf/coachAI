import { createClient } from '@supabase/supabase-js';
import {
  createGarminClient,
  getActivities,
  getActivityDetails,
  getWellnessData,
  getHRVData,
  getSleepData,
} from './client';
import { transformActivity, transformWellness } from './transform';
import { subDays, format } from 'date-fns';

export interface SyncOptions {
  userId: string;
  garminEmail: string;
  garminPassword: string;
  activitiesLimit?: number;
  syncWellnessDays?: number;
  fullSync?: boolean;
}

export interface SyncResult {
  activitiesSynced: number;
  wellnessDaysSynced: number;
  errors: string[];
  syncLogId: string;
}

export async function syncGarminData(options: SyncOptions): Promise<SyncResult> {
  const {
    userId,
    garminEmail,
    garminPassword,
    activitiesLimit = 20,
    syncWellnessDays = 7,
    fullSync = false,
  } = options;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create sync log
  const { data: syncLog, error: syncLogError } = await supabase
    .from('sync_logs')
    .insert({
      user_id: userId,
      sync_type: fullSync ? 'full' : 'incremental',
      status: 'running',
    })
    .select()
    .single();

  if (syncLogError || !syncLog) {
    throw new Error('Failed to create sync log');
  }

  const syncLogId = syncLog.id;
  const errors: string[] = [];
  let activitiesSynced = 0;
  let wellnessDaysSynced = 0;

  try {
    // Connect to Garmin
    const garminClient = await createGarminClient(garminEmail, garminPassword);

    // Determine how many activities to fetch
    let limit = activitiesLimit;
    if (!fullSync) {
      // For incremental sync, check when last sync was
      const { data: lastSync } = await supabase
        .from('sync_logs')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSync?.completed_at) {
        // Only fetch activities since last sync (estimate ~5 per day)
        const daysSinceSync = Math.ceil(
          (Date.now() - new Date(lastSync.completed_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        limit = Math.min(daysSinceSync * 3, 50);
      }
    }

    // Sync activities
    const activities = await getActivities(garminClient, limit);

    for (const activity of activities) {
      try {
        // Only sync running activities
        const typeKey = activity.activityType?.typeKey?.toLowerCase() ?? '';
        if (
          !typeKey.includes('running') &&
          !typeKey.includes('trail') &&
          typeKey !== 'running'
        ) {
          continue;
        }

        // Get full activity details for splits and HR zones
        const details = await getActivityDetails(
          garminClient,
          activity.activityId
        );

        const activityData = transformActivity(activity, userId, details ?? undefined);

        // Upsert to Supabase
        const { error } = await supabase
          .from('activities')
          .upsert(activityData, {
            onConflict: 'garmin_activity_id',
            ignoreDuplicates: false,
          });

        if (error) {
          errors.push(
            `Failed to save activity ${activity.activityId}: ${error.message}`
          );
        } else {
          activitiesSynced++;
        }
      } catch (activityError) {
        errors.push(
          `Error processing activity ${activity.activityId}: ${String(activityError)}`
        );
      }
    }

    // Sync wellness data
    const today = new Date();
    for (let i = 0; i < syncWellnessDays; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      try {
        const [wellness, hrv, sleep] = await Promise.allSettled([
          getWellnessData(garminClient, date),
          getHRVData(garminClient, date),
          getSleepData(garminClient, date),
        ]);

        const wellnessData =
          wellness.status === 'fulfilled' ? wellness.value : null;
        const hrvData = hrv.status === 'fulfilled' ? hrv.value : null;
        const sleepData = sleep.status === 'fulfilled' ? sleep.value : null;

        if (wellnessData) {
          const wellnessInsert = transformWellness(
            wellnessData,
            hrvData,
            sleepData,
            userId,
            dateStr
          );

          const { error } = await supabase
            .from('daily_wellness')
            .upsert(wellnessInsert, {
              onConflict: 'user_id,date',
              ignoreDuplicates: false,
            });

          if (error) {
            errors.push(`Failed to save wellness for ${dateStr}: ${error.message}`);
          } else {
            wellnessDaysSynced++;
          }
        }
      } catch (wellnessError) {
        errors.push(
          `Error syncing wellness for ${dateStr}: ${String(wellnessError)}`
        );
      }
    }

    // Update profile last sync time
    await supabase
      .from('profiles')
      .update({ garmin_last_sync: new Date().toISOString() })
      .eq('id', userId);

    // Update sync log as completed
    await supabase
      .from('sync_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        activities_synced: activitiesSynced,
        wellness_days_synced: wellnessDaysSynced,
        error_message: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', syncLogId);

    return { activitiesSynced, wellnessDaysSynced, errors, syncLogId };
  } catch (error) {
    // Update sync log as failed
    await supabase
      .from('sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: String(error),
      })
      .eq('id', syncLogId);

    throw error;
  }
}

export async function decryptGarminPassword(
  encryptedPassword: string
): Promise<string> {
  const key = process.env.GARMIN_ENCRYPTION_KEY!;
  if (!key) throw new Error('GARMIN_ENCRYPTION_KEY not set');

  // Simple XOR-based decryption for demonstration
  // In production, use proper AES-256 encryption
  const keyBytes = Buffer.from(key, 'base64');
  const encrypted = Buffer.from(encryptedPassword, 'base64');
  const decrypted = Buffer.alloc(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }

  return decrypted.toString('utf-8');
}

export async function encryptGarminPassword(password: string): Promise<string> {
  const key = process.env.GARMIN_ENCRYPTION_KEY!;
  if (!key) throw new Error('GARMIN_ENCRYPTION_KEY not set');

  const keyBytes = Buffer.from(key, 'base64');
  const passwordBytes = Buffer.from(password, 'utf-8');
  const encrypted = Buffer.alloc(passwordBytes.length);

  for (let i = 0; i < passwordBytes.length; i++) {
    encrypted[i] = passwordBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return encrypted.toString('base64');
}
