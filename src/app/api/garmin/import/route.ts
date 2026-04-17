import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activities = [], wellness = [] } = body;

    let activitiesImported = 0;
    let wellnessImported = 0;
    const errors: string[] = [];

    // Import activities
    for (const activity of activities) {
      const { error } = await supabase
        .from('activities')
        .upsert({ ...activity, user_id: user.id }, {
          onConflict: 'garmin_activity_id',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`Activity ${activity.garmin_activity_id}: ${error.message}`);
      } else {
        activitiesImported++;
      }
    }

    // Import wellness
    for (const day of wellness) {
      const { error } = await supabase
        .from('daily_wellness')
        .upsert({ ...day, user_id: user.id }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`Wellness ${day.date}: ${error.message}`);
      } else {
        wellnessImported++;
      }
    }

    // Update profile last sync time
    await supabase
      .from('profiles')
      .update({ garmin_last_sync: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      activitiesImported,
      wellnessImported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
