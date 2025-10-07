const VERCEL_PROXY_URL = 'https://aspire-api--psi.vercel.app/api/aspire-proxy';
const ASPIRE_CLIENT_ID = process.env.ASPIRE_CLIENT_ID!;
const ASPIRE_API_KEY = process.env.ASPIRE_API_KEY!;

interface AspireOpportunity {
  OpportunityID: number;
  OpportunityNumber: number;
  PropertyName: string;
  OpportunityName: string;
  EstimatedDollars: number;
  WonDollars: number;
  SalesRepContactName: string;
  OperationsManagerContactName: string;
  CreatedDateTime: string;
  StartDate: string;
  WonDate: string | null;
  CompleteDate: string | null;
  DivisionName: string;
  BranchName: string;
  RegionName: string;
  OpportunityStatusName: string;
  ActualLaborHours: number | null;
  EstimatedLaborHours: number | null;
  ActualGrossMarginPercent: number | null;
  EstimatedGrossMarginPercent: number | null;
  EstimatedMaterialCost: number | null;
  ActualCostMaterial: number | null;
  EstimatorNotes: string | null;
}

interface AspireProperty {
  PropertyName: string;
  AccountOwnerContactName: string | null;
  AccountOwnerContactID: number | null;
}

async function callAspireAPI(endpoint: string, orderByField?: string, pageNumber: number = 1): Promise<any[]> {
  console.log(`[API CALL] Calling Aspire API via proxy: ${endpoint} (page ${pageNumber})`);
  
  const timestamp = Date.now();
  let url = `${VERCEL_PROXY_URL}?clientId=${encodeURIComponent(ASPIRE_CLIENT_ID)}&secret=${encodeURIComponent(ASPIRE_API_KEY)}&endpoint=${encodeURIComponent(endpoint)}&$limit=1000&$pagenumber=${pageNumber}&_t=${timestamp}`;
  
  // Add orderby only if specified
  if (orderByField) {
    url += `&$orderby=${encodeURIComponent(orderByField + ' desc')}`;
  }
  
  console.log(`[API CALL] Calling (credentials hidden)`);
  
  const response = await fetch(url, {
    method: 'GET',
  });
  
  console.log(`[API CALL] Response status: ${response.status}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API CALL] Error response: ${text}`);
    throw new Error(`Aspire API error: ${response.status} ${text}`);
  }
  
  const data = await response.json();
  console.log(`[API CALL] Response type: ${Array.isArray(data) ? 'array' : 'object'}`);
  console.log(`[API CALL] Data keys: ${Object.keys(data).join(', ')}`);
  
  const result = Array.isArray(data) ? data : (data.value || []);
  console.log(`[API CALL] Page ${pageNumber}: Returning ${result.length} records`);
  
  return result;
}

async function fetchAllPages(endpoint: string, orderByField?: string): Promise<any[]> {
  console.log(`[PAGINATION] Starting to fetch all pages from ${endpoint}`);
  
  let allRecords: any[] = [];
  let pageNumber = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    const pageRecords = await callAspireAPI(endpoint, orderByField, pageNumber);
    
    if (pageRecords.length > 0) {
      allRecords = allRecords.concat(pageRecords);
      console.log(`[PAGINATION] Page ${pageNumber}: Got ${pageRecords.length} records. Total so far: ${allRecords.length}`);
      
      // If we got fewer than 1000 records, we're on the last page
      if (pageRecords.length < 1000) {
        hasMorePages = false;
        console.log(`[PAGINATION] Last page reached (got ${pageRecords.length} < 1000)`);
      } else {
        pageNumber++;
      }
    } else {
      hasMorePages = false;
      console.log(`[PAGINATION] No more records on page ${pageNumber}`);
    }
  }
  
  console.log(`[PAGINATION] Finished fetching ${endpoint}. Total records: ${allRecords.length}`);
  return allRecords;
}

async function fetchOpportunitiesWithCutoff(cutoffDate: Date): Promise<AspireOpportunity[]> {
  console.log(`[SMART FETCH] Fetching opportunities until cutoff date: ${cutoffDate.toISOString()}`);
  
  let allOpportunities: AspireOpportunity[] = [];
  let pageNumber = 1;
  let shouldContinue = true;
  let pagesWithoutMatch = 0;
  const maxPagesWithoutMatch = 3; // Stop after 3 consecutive pages with no matches
  
  while (shouldContinue) {
    console.log(`[SMART FETCH] Fetching opportunities page ${pageNumber}...`);
    const pageRecords = await callAspireAPI('/Opportunities', 'OpportunityID', pageNumber);
    
    if (pageRecords.length === 0) {
      console.log(`[SMART FETCH] No more records, stopping`);
      break;
    }
    
    allOpportunities = allOpportunities.concat(pageRecords);
    console.log(`[SMART FETCH] Page ${pageNumber}: Got ${pageRecords.length} records. Total: ${allOpportunities.length}`);
    
    // Check if any records on this page have WonDate >= cutoff
    const matchingRecords = pageRecords.filter((opp: AspireOpportunity) => {
      if (!opp.WonDate) return false;
      const wonDate = new Date(opp.WonDate);
      return wonDate >= cutoffDate;
    });
    
    console.log(`[SMART FETCH] Page ${pageNumber}: ${matchingRecords.length} records with WonDate >= cutoff`);
    
    if (matchingRecords.length === 0) {
      pagesWithoutMatch++;
      console.log(`[SMART FETCH] Pages without match: ${pagesWithoutMatch}/${maxPagesWithoutMatch}`);
      
      if (pagesWithoutMatch >= maxPagesWithoutMatch) {
        console.log(`[SMART FETCH] Stopping: ${maxPagesWithoutMatch} consecutive pages with no matching dates`);
        shouldContinue = false;
      }
    } else {
      pagesWithoutMatch = 0; // Reset counter when we find matches
    }
    
    // Also stop if we got fewer than 1000 records (last page)
    if (pageRecords.length < 1000) {
      console.log(`[SMART FETCH] Last page reached (${pageRecords.length} < 1000)`);
      shouldContinue = false;
    }
    
    pageNumber++;
    
    // Safety limit: don't fetch more than 10 pages (10,000 records)
    if (pageNumber > 10) {
      console.log(`[SMART FETCH] Safety limit reached (10 pages), stopping`);
      shouldContinue = false;
    }
  }
  
  console.log(`[SMART FETCH] Finished. Total opportunities fetched: ${allOpportunities.length}`);
  return allOpportunities;
}

export async function syncAspireOpportunities(supabase: any, testLimit?: number) {
  console.log('Starting Aspire sync...');
  
  try {
    const cutoffDate = new Date('2025-08-01T00:00:00Z');
    console.log('Cutoff date:', cutoffDate.toISOString());
    
    // Step 1: Get opportunities intelligently (stop after cutoff date)
    console.log('Fetching opportunities (with smart cutoff)...');
    const allOpportunities: AspireOpportunity[] = await fetchOpportunitiesWithCutoff(cutoffDate);
    console.log(`Total opportunities fetched: ${allOpportunities.length}`);
    
    // Step 2: Get ALL properties with pagination (need complete lookup map)
    console.log('Fetching all properties with pagination...');
    const allProperties: AspireProperty[] = await fetchAllPages('/Properties');
    console.log(`Total properties found: ${allProperties.length}`);
    
    // Create a lookup map: PropertyName -> AccountOwnerContactName
    const propertyMap = new Map<string, string>();
    allProperties.forEach(prop => {
      if (prop.PropertyName && prop.AccountOwnerContactName) {
        propertyMap.set(prop.PropertyName, prop.AccountOwnerContactName);
      }
    });
    console.log(`Property map created with ${propertyMap.size} entries`);
    
    // Log first opportunity to see structure
    if (allOpportunities.length > 0) {
      console.log('Sample opportunity:', JSON.stringify(allOpportunities[0], null, 2));
      
      // Check unique division names
      const divisions = [...new Set(allOpportunities.map(o => o.DivisionName).filter(Boolean))];
      console.log('Unique divisions found:', divisions);
      
      // Check how many have WonDate populated
      const oppsWithWonDate = allOpportunities.filter(o => o.WonDate);
      console.log(`Opportunities with WonDate: ${oppsWithWonDate.length} out of ${allOpportunities.length}`);
      
      // Check how many have CompleteDate populated
      const oppsWithCompleteDate = allOpportunities.filter(o => o.CompleteDate);
      console.log(`Opportunities with CompleteDate: ${oppsWithCompleteDate.length} out of ${allOpportunities.length}`);
      
      // Show recent WonDates
      const recentWonDates = oppsWithWonDate
        .sort((a, b) => new Date(b.WonDate!).getTime() - new Date(a.WonDate!).getTime())
        .slice(0, 5)
        .map(o => ({ 
          id: o.OpportunityID, 
          name: o.OpportunityName,
          wonDate: o.WonDate,
          completeDate: o.CompleteDate,
          division: o.DivisionName 
        }));
      console.log('Most recent WonDates:', JSON.stringify(recentWonDates, null, 2));
    }
    
    // Filter in JavaScript with detailed logging
    let enhancementCount = 0;
    let wonDateCount = 0;
    let hasWonDateCount = 0;
    
    const opportunities = allOpportunities.filter(o => {
      // Must be in Enhancements division
      const isEnhancement = o.DivisionName && o.DivisionName.toLowerCase().includes('enhancement');
      if (isEnhancement) enhancementCount++;
      
      // Must have WonDate (not null)
      if (o.WonDate) hasWonDateCount++;
      
      // Must have WonDate on or after 8/1/2025
      let hasValidWonDate = false;
      if (o.WonDate) {
        const wonDate = new Date(o.WonDate);
        hasValidWonDate = wonDate >= cutoffDate;
        if (hasValidWonDate) wonDateCount++;
      }
      
      return isEnhancement && hasValidWonDate;
    });
    
    console.log(`Filter results:`);
    console.log(`  - ${enhancementCount} opportunities in Enhancements division`);
    console.log(`  - ${hasWonDateCount} opportunities with WonDate (not null)`);
    console.log(`  - ${wonDateCount} opportunities with WonDate >= 8/1/2025`);
    console.log(`  - ${opportunities.length} opportunities matching both criteria`);
    
    // Apply test limit if specified
    const oppsToSync = testLimit ? opportunities.slice(0, testLimit) : opportunities;
    console.log(`Syncing ${oppsToSync.length} opportunities${testLimit ? ' (TEST MODE)' : ''}`);
    
    let syncedCount = 0;
    let errorCount = 0;
    let missingAccountManagerCount = 0;
    
    for (const opp of oppsToSync) {
      try {
        // Determine the value (prefer WonDollars if available)
        const value = opp.WonDollars || opp.EstimatedDollars || 0;
        
        const aspireWoNumber = opp.OpportunityNumber?.toString() || opp.OpportunityID.toString();
        
        // Get Account Manager from Property lookup
        const accountManager = propertyMap.get(opp.PropertyName);
        if (!accountManager) {
          missingAccountManagerCount++;
          console.log(`[MISSING] No Account Manager found for property: "${opp.PropertyName}" (WO: ${aspireWoNumber})`);
        }
        
        // Check if this opportunity already exists
        const { data: existing } = await supabase
          .from('projects')
          .select('stage, notes, notes_by, notes_date, current_stage_notes, current_stage_notes_by, current_stage_notes_date, materials_status, initial_meeting_scheduled_date, before_photo_link, before_photo_date, progress_photo_links, completion_photo_link, completion_photo_date, materials_vendors, field_supervisor')
          .eq('aspire_wo_number', aspireWoNumber)
          .single();
        
        // Map to your project structure with CORRECT field mappings
        const projectData = {
          aspire_wo_number: aspireWoNumber,
          opportunity_id: opp.OpportunityID,
          property: opp.PropertyName || 'Unknown Property',
          opp_name: opp.OpportunityName,
          stage: existing?.stage || 'proposal_verification',
          materials_status: existing?.materials_status || 'need_to_order',
          value: value,
          client_specialist: accountManager || 'Unknown',
          enh_specialist: opp.SalesRepContactName || 'Unknown',
          branch_name: opp.BranchName || null,
          region_name: opp.RegionName || null,
          actual_labor_hours: opp.ActualLaborHours || null,
          estimated_labor_hours: opp.EstimatedLaborHours || null,
          actual_gross_margin_percent: opp.ActualGrossMarginPercent || null,
          estimated_gross_margin_percent: opp.EstimatedGrossMarginPercent || null,
          estimated_material_cost: opp.EstimatedMaterialCost || null,
          actual_cost_material: opp.ActualCostMaterial || null,
          estimator_notes: opp.EstimatorNotes || null,
          notes: existing?.notes || opp.EstimatorNotes || null,
          notes_by: existing?.notes_by || null,
          notes_date: existing?.notes_date || null,
          current_stage_notes: existing?.current_stage_notes || null,
          current_stage_notes_by: existing?.current_stage_notes_by || null,
          current_stage_notes_date: existing?.current_stage_notes_date || null,
          created_date: opp.CreatedDateTime || new Date().toISOString(),
          scheduled_date: opp.StartDate || null,
          won_date: opp.WonDate || null,
          completed_date: opp.CompleteDate || null,
          initial_meeting_scheduled_date: existing?.initial_meeting_scheduled_date || null,
          before_photo_link: existing?.before_photo_link || null,
          before_photo_date: existing?.before_photo_date || null,
          progress_photo_links: existing?.progress_photo_links || null,
          completion_photo_link: existing?.completion_photo_link || null,
          completion_photo_date: existing?.completion_photo_date || null,
          materials_vendors: existing?.materials_vendors || null,
          field_supervisor: existing?.field_supervisor || null,
          requires_irrigation: false,
          requires_spray: false,
          last_synced_from_aspire: new Date().toISOString(),
        };
        
        // Upsert (insert or update if exists)
        const { error } = await supabase
          .from('projects')
          .upsert(projectData, {
            onConflict: 'aspire_wo_number',
            ignoreDuplicates: false,
          });
        
        if (error) {
          console.error(`Error syncing opportunity ${opp.OpportunityID}:`, error);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (err) {
        console.error(`Failed to process opportunity ${opp.OpportunityID}:`, err);
        errorCount++;
      }
    }
    
    console.log(`[SUMMARY] Missing Account Managers: ${missingAccountManagerCount} out of ${oppsToSync.length}`);
    
    // Log the sync
    await supabase.rpc('log_aspire_sync', {
      p_records_synced: syncedCount,
      p_status: errorCount > 0 ? 'success_with_errors' : 'success',
      p_error_message: errorCount > 0 ? `${errorCount} records failed` : null,
    });
    
    console.log(`Sync complete: ${syncedCount} synced, ${errorCount} errors`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: opportunities.length,
    };
  } catch (error) {
    console.error('Aspire sync failed:', error);
    
    // Log the failure
    await supabase.rpc('log_aspire_sync', {
      p_records_synced: 0,
      p_status: 'error',
      p_error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}