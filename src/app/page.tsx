'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/lib/types';
import ProjectTable from '@/components/ProjectTable';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import StatsBar from '@/components/StatsBar';
import FilterButtons from '@/components/FilterButtons';
import SyncProgressModal from '@/components/SyncProgressModal';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterClientSpecialist, setFilterClientSpecialist] = useState('all');
  const [filterEnhSpecialist, setFilterEnhSpecialist] = useState('all');

  const activeProjects = projects.filter(p => p.status !== 'proposal');
  
  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const regions = [...new Set(activeProjects.map(p => p.regionName).filter(Boolean))].sort() as string[];
    const branches = [...new Set(activeProjects.map(p => p.branchName).filter(Boolean))].sort() as string[];
    const clientSpecialists = [...new Set(activeProjects.map(p => p.accountManager).filter(Boolean))].sort() as string[];
    const enhSpecialists = [...new Set(activeProjects.map(p => p.specialist).filter(Boolean))].sort() as string[];
    
    return { regions, branches, clientSpecialists, enhSpecialists };
  }, [activeProjects]);

  // DEMOGRAPHIC FILTERS: Used for Stats Bar - shows ALL stages (including proposal)
  const demographicFilteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (filterRegion !== 'all') {
      filtered = filtered.filter(p => p.regionName === filterRegion);
    }
    if (filterBranch !== 'all') {
      filtered = filtered.filter(p => p.branchName === filterBranch);
    }
    if (filterClientSpecialist !== 'all') {
      filtered = filtered.filter(p => p.accountManager === filterClientSpecialist);
    }
    if (filterEnhSpecialist !== 'all') {
      filtered = filtered.filter(p => p.specialist === filterEnhSpecialist);
    }
    
    return filtered;
  }, [projects, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist]);

  // TABLE FILTERS: Used for Project Table - filters by status AND demographics
  const tableFilteredProjects = useMemo(() => {
    let filtered = activeProjects;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    if (filterRegion !== 'all') {
      filtered = filtered.filter(p => p.regionName === filterRegion);
    }
    if (filterBranch !== 'all') {
      filtered = filtered.filter(p => p.branchName === filterBranch);
    }
    if (filterClientSpecialist !== 'all') {
      filtered = filtered.filter(p => p.accountManager === filterClientSpecialist);
    }
    if (filterEnhSpecialist !== 'all') {
      filtered = filtered.filter(p => p.specialist === filterEnhSpecialist);
    }
    
    return filtered;
  }, [activeProjects, filterStatus, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist]);

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
      setSyncMessage('Network error: ' + error);
      
      setTimeout(() => {
        setSyncing(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
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
                    <User className="text-gray-600" size={20} />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats - Uses demographic filters only, shows ALL stages */}
        <StatsBar projects={demographicFilteredProjects} />

        {/* Filters */}
        <FilterButtons
          filterStatus={filterStatus}
          filterRegion={filterRegion}
          filterBranch={filterBranch}
          filterClientSpecialist={filterClientSpecialist}
          filterEnhSpecialist={filterEnhSpecialist}
          onFilterStatusChange={setFilterStatus}
          onFilterRegionChange={setFilterRegion}
          onFilterBranchChange={setFilterBranch}
          onFilterClientSpecialistChange={setFilterClientSpecialist}
          onFilterEnhSpecialistChange={setFilterEnhSpecialist}
          regions={filterOptions.regions}
          branches={filterOptions.branches}
          clientSpecialists={filterOptions.clientSpecialists}
          enhSpecialists={filterOptions.enhSpecialists}
        />

        {/* Project Table - Uses ALL filters including status */}
        <ProjectTable 
          projects={tableFilteredProjects}
          onViewDetails={setSelectedProject}
          onUpdateProject={updateProject}
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