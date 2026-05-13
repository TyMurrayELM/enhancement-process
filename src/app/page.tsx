'use client';

import { Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/lib/types';
import ProjectTable from '@/components/ProjectTable';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import StatsBar from '@/components/StatsBar';
import FilterButtons from '@/components/FilterButtons';
import SyncProgressModal from '@/components/SyncProgressModal';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';

// Short URL-param keys for filter state so shareable links stay readable.
const PARAM_KEYS = {
  status: 's',
  region: 'r',
  branch: 'b',
  clientSpecialist: 'cs',
  enhSpecialist: 'es',
  fieldSupervisor: 'fs',
  search: 'q',
  mine: 'mine',
} as const;

function normalize(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, updateProject, refetch } = useProjects();
  
  // ALL STATE HOOKS MUST BE DECLARED AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'success' | 'error'>('syncing');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncedCount, setSyncedCount] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Reusable function to fetch last sync time from database
  const fetchLastSyncTime = useCallback(async () => {
    try {
      const response = await fetch('/api/last-sync-time');
      const data = await response.json();
      if (data.lastSyncTime) {
        setLastSyncTime(data.lastSyncTime);
      }
    } catch (error) {
      console.error('Failed to fetch last sync time:', error);
    }
  }, []);

  // Fetch last sync time from database on mount
  useEffect(() => {
    fetchLastSyncTime();
  }, [fetchLastSyncTime]);
  
  // Filter states — initial values come from URL querystring so filter selections are shareable.
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get(PARAM_KEYS.status) || 'all');
  const [filterRegion, setFilterRegion] = useState(() => searchParams.get(PARAM_KEYS.region) || 'all');
  const [filterBranch, setFilterBranch] = useState(() => searchParams.get(PARAM_KEYS.branch) || 'all');
  const [filterClientSpecialist, setFilterClientSpecialist] = useState(() => searchParams.get(PARAM_KEYS.clientSpecialist) || 'all');
  const [filterEnhSpecialist, setFilterEnhSpecialist] = useState(() => searchParams.get(PARAM_KEYS.enhSpecialist) || 'all');
  const [filterFieldSupervisor, setFilterFieldSupervisor] = useState(() => searchParams.get(PARAM_KEYS.fieldSupervisor) || 'all');
  const [filterSearch, setFilterSearch] = useState(() => searchParams.get(PARAM_KEYS.search) || '');
  const [filterMine, setFilterMine] = useState(() => searchParams.get(PARAM_KEYS.mine) === '1');

  // Mirror filter state into the URL so reload, back, and bookmarks all reproduce the same view.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set(PARAM_KEYS.status, filterStatus);
    if (filterRegion !== 'all') params.set(PARAM_KEYS.region, filterRegion);
    if (filterBranch !== 'all') params.set(PARAM_KEYS.branch, filterBranch);
    if (filterClientSpecialist !== 'all') params.set(PARAM_KEYS.clientSpecialist, filterClientSpecialist);
    if (filterEnhSpecialist !== 'all') params.set(PARAM_KEYS.enhSpecialist, filterEnhSpecialist);
    if (filterFieldSupervisor !== 'all') params.set(PARAM_KEYS.fieldSupervisor, filterFieldSupervisor);
    if (filterSearch.trim()) params.set(PARAM_KEYS.search, filterSearch.trim());
    if (filterMine) params.set(PARAM_KEYS.mine, '1');
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [router, filterStatus, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist, filterFieldSupervisor, filterSearch, filterMine]);

  const sessionUserName = session?.user?.name;
  const isAssignedToMe = useCallback(
    (project: Project): boolean => {
      const me = normalize(sessionUserName);
      if (!me) return false;
      return (
        normalize(project.accountManager) === me ||
        normalize(project.specialist) === me ||
        normalize(project.fieldSupervisor) === me
      );
    },
    [sessionUserName],
  );

  const activeProjects = projects.filter(p => p.status !== 'proposal');

  // Build a deduped, trimmed, case-insensitive list, keeping the first canonical form seen.
  const uniqueTrimmed = (values: (string | undefined | null)[]): string[] => {
    const seen = new Map<string, string>();
    for (const raw of values) {
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) seen.set(key, trimmed);
    }
    return [...seen.values()].sort();
  };

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => ({
    regions: uniqueTrimmed(activeProjects.map(p => p.regionName)),
    branches: uniqueTrimmed(activeProjects.map(p => p.branchName)),
    clientSpecialists: uniqueTrimmed(activeProjects.map(p => p.accountManager)),
    enhSpecialists: uniqueTrimmed(activeProjects.map(p => p.specialist)),
    fieldSupervisors: uniqueTrimmed(activeProjects.map(p => p.fieldSupervisor)),
  }), [activeProjects]);

  // Case-insensitive, whitespace-tolerant match for filter equality.
  const matches = (a?: string | null, b?: string | null) => normalize(a) === normalize(b);

  // Search by WO#, property, or opp name.
  const matchesSearch = (p: Project, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (p.aspireWoNumber ?? '').toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      (p.oppName ?? '').toLowerCase().includes(q)
    );
  };

  // DEMOGRAPHIC FILTERS: Used for Stats Bar - shows ALL stages (including proposal)
  const demographicFilteredProjects = useMemo(() => {
    let filtered = projects;

    if (filterRegion !== 'all') {
      filtered = filtered.filter(p => matches(p.regionName, filterRegion));
    }
    if (filterBranch !== 'all') {
      filtered = filtered.filter(p => matches(p.branchName, filterBranch));
    }
    if (filterClientSpecialist !== 'all') {
      filtered = filtered.filter(p => matches(p.accountManager, filterClientSpecialist));
    }
    if (filterEnhSpecialist !== 'all') {
      filtered = filtered.filter(p => matches(p.specialist, filterEnhSpecialist));
    }
    if (filterFieldSupervisor !== 'all') {
      filtered = filtered.filter(p => matches(p.fieldSupervisor, filterFieldSupervisor));
    }
    if (filterMine) {
      filtered = filtered.filter(isAssignedToMe);
    }
    if (filterSearch.trim()) {
      filtered = filtered.filter(p => matchesSearch(p, filterSearch.trim()));
    }

    return filtered;
  }, [projects, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist, filterFieldSupervisor, filterMine, filterSearch, isAssignedToMe]);

  // TABLE FILTERS: Used for Project Table - filters by status AND demographics
  const tableFilteredProjects = useMemo(() => {
    let filtered = activeProjects;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterRegion !== 'all') {
      filtered = filtered.filter(p => matches(p.regionName, filterRegion));
    }
    if (filterBranch !== 'all') {
      filtered = filtered.filter(p => matches(p.branchName, filterBranch));
    }
    if (filterClientSpecialist !== 'all') {
      filtered = filtered.filter(p => matches(p.accountManager, filterClientSpecialist));
    }
    if (filterEnhSpecialist !== 'all') {
      filtered = filtered.filter(p => matches(p.specialist, filterEnhSpecialist));
    }
    if (filterFieldSupervisor !== 'all') {
      filtered = filtered.filter(p => matches(p.fieldSupervisor, filterFieldSupervisor));
    }
    if (filterMine) {
      filtered = filtered.filter(isAssignedToMe);
    }
    if (filterSearch.trim()) {
      filtered = filtered.filter(p => matchesSearch(p, filterSearch.trim()));
    }

    return filtered;
  }, [activeProjects, filterStatus, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist, filterFieldSupervisor, filterMine, filterSearch, isAssignedToMe]);

  const hasActiveFilters =
    filterStatus !== 'all' ||
    filterRegion !== 'all' ||
    filterBranch !== 'all' ||
    filterClientSpecialist !== 'all' ||
    filterEnhSpecialist !== 'all' ||
    filterFieldSupervisor !== 'all' ||
    filterMine ||
    filterSearch.trim() !== '';

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterRegion('all');
    setFilterBranch('all');
    setFilterClientSpecialist('all');
    setFilterEnhSpecialist('all');
    setFilterFieldSupervisor('all');
    setFilterMine(false);
    setFilterSearch('');
  };

  // Redirect to sign-in if not authenticated - AFTER all hooks are declared
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // NOW we can do conditional rendering AFTER all hooks are declared
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null;
  }

  // Format last sync time for Arizona timezone
  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Phoenix',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle clicking on stage cards to filter
  const handleStageClick = (stage: string) => {
    setFilterStatus(stage);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('');
    setCurrentStage(0);
    
    // Simulate progress through stages - adjusted to match ~60 second sync time
    const stageTimer1 = setTimeout(() => setCurrentStage(1), 20000); // 20 seconds for fetching opportunities
    const stageTimer2 = setTimeout(() => setCurrentStage(2), 40000); // 40 seconds for fetching property data
    // Stage 3 starts when sync actually completes
    
    try {
      const response = await fetch('/api/sync-aspire', { method: 'POST' });
      const result = await response.json();
      
      // Clear timers if sync completes early
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      
      if (response.ok) {
        setCurrentStage(3); // All stages complete
        setSyncStatus('success');
        setSyncedCount(result.synced || 0);
        setSyncMessage(`Successfully synced ${result.synced} opportunities`);
        
        // Fetch the updated sync timestamp from database
        await fetchLastSyncTime();
        
        setTimeout(() => {
          setSyncing(false);
          refetch();
        }, 2000);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.error || 'Sync failed');
        
        setTimeout(() => {
          setSyncing(false);
        }, 3000);
      }
    } catch (error) {
      // Clear timers on error
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      
      setSyncStatus('error');
      const message = error instanceof Error ? error.message : String(error);
      setSyncMessage(`Network error: ${message}`);
      
      setTimeout(() => {
        setSyncing(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image
                  src="/encore.png"
                  alt="Encore Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Enhancement Process</h1>
                <p className="text-sm text-gray-500">Workflow Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:bg-gray-400"
                >
                  {syncing ? 'Syncing...' : 'Sync from Aspire'}
                </button>
                {lastSyncTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {formatLastSync(lastSyncTime)}
                  </p>
                )}
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Stats - Uses demographic filters only, shows ALL stages */}
        <StatsBar 
          projects={demographicFilteredProjects}
          onStageClick={handleStageClick}
        />

        {/* Filters */}
        <FilterButtons
          filterStatus={filterStatus}
          filterRegion={filterRegion}
          filterBranch={filterBranch}
          filterClientSpecialist={filterClientSpecialist}
          filterEnhSpecialist={filterEnhSpecialist}
          filterFieldSupervisor={filterFieldSupervisor}
          filterSearch={filterSearch}
          filterMine={filterMine}
          onFilterStatusChange={setFilterStatus}
          onFilterRegionChange={setFilterRegion}
          onFilterBranchChange={setFilterBranch}
          onFilterClientSpecialistChange={setFilterClientSpecialist}
          onFilterEnhSpecialistChange={setFilterEnhSpecialist}
          onFilterFieldSupervisorChange={setFilterFieldSupervisor}
          onFilterSearchChange={setFilterSearch}
          onFilterMineChange={setFilterMine}
          regions={filterOptions.regions}
          branches={filterOptions.branches}
          clientSpecialists={filterOptions.clientSpecialists}
          enhSpecialists={filterOptions.enhSpecialists}
          fieldSupervisors={filterOptions.fieldSupervisors}
          totalCount={activeProjects.length}
          filteredCount={tableFilteredProjects.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          canFilterMine={!!sessionUserName}
        />

        {/* Project Table - Uses ALL filters including status */}
        <ProjectTable
          projects={tableFilteredProjects}
          onViewDetails={setSelectedProject}
          onUpdateProject={updateProject}
          isAssignedToMe={isAssignedToMe}
        />

        {tableFilteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No projects found with current filters</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateProject={updateProject}
        />
      )}

      {/* Sync Progress Modal */}
      <SyncProgressModal
        isOpen={syncing}
        status={syncStatus}
        message={syncMessage}
        syncedCount={syncedCount}
        currentStage={currentStage}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}