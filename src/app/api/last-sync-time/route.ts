import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Use service key for server-side
    );

    // Query the most recent successful sync from aspire_sync_log table (correct table name!)
    const { data, error } = await supabase
      .from('aspire_sync_log')
      .select('sync_completed_at')
      .in('status', ['success', 'success_with_errors']) // Only get successful syncs
      .order('sync_completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last sync time:', error);
      return NextResponse.json(
        { error: 'Failed to fetch last sync time' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lastSyncTime: data?.sync_completed_at || null
    });
  } catch (error) {
    console.error('Last sync time API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch last sync time' },
      { status: 500 }
    );
  }
}