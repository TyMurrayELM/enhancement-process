import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Query the aspire_sync_log table for the most recent successful sync
    const { data, error } = await supabase
      .from('aspire_sync_log')
      .select('synced_at')
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last sync time:', error);
      return NextResponse.json({ lastSyncTime: null });
    }

    return NextResponse.json({ 
      lastSyncTime: data?.synced_at || null 
    });
  } catch (error) {
    console.error('Failed to fetch last sync time:', error);
    return NextResponse.json({ lastSyncTime: null });
  }
}