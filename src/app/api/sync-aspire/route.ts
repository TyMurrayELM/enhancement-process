import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAspireOpportunities } from '@/lib/aspireSync';

export async function POST(request: Request) {
  try {
    // Optional: Add authentication check here
    // const session = await getSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Use service key for server-side
    );
    
    // TEST MODE: Only sync 3 records
    // Remove the number to sync all records
   const result = await syncAspireOpportunities(supabase);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}