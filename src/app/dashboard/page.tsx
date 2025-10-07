'use client';

import { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/lib/types';
import ProjectTable from '@/components/ProjectTable';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import StatsBar from '@/components/StatsBar';
import FilterButtons from '@/components/FilterButtons';
import { Wrench } from 'lucide-react';

export default function DashboardPage() {
  const { projects, updateProject, refetch } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [syncing, setSyncing] = useState(false);
  
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

  // Apply all filters
  const filteredProjects = useMemo(() => {
    let filtered = activeProjects;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by region
    if (filterRegion !== 'all') {
      filtered = filtered.filter(p => p.regionName === filterRegion);
    }
    
    // Filter by branch
    if (filterBranch !== 'all') {
      filtered = filtered.filter(p => p.branchName === filterBranch);
    }
    
    // Filter by client specialist
    if (filterClientSpecialist !== 'all') {
      filtered = filtered.filter(p => p.accountManager === filterClientSpecialist);
    }
    
    // Filter by enhancement specialist
    if (filterEnhSpecialist !== 'all') {
      filtered = filtered.filter(p => p.specialist === filterEnhSpecialist);
    }
    
    return filtered;
  }, [activeProjects, filterStatus, filterRegion, filterBranch, filterClientSpecialist, filterEnhSpecialist]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-aspire', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        alert(`Sync complete: ${result.synced} opportunities synced`);
        refetch();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert('Sync failed: ' + error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Wrench className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Enhancement Projects</h1>
                <p className="text-sm text-gray-500">Workflow Management System</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:bg-gray-400"
              >
                {syncing ? 'Syncing...' : 'Sync from Aspire'}
              </button>
              <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                + New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <StatsBar projects={activeProjects} />

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

        {/* Project Table */}
        <ProjectTable 
          projects={filteredProjects}
          onViewDetails={setSelectedProject}
          onUpdateProject={updateProject}
        />

        {filteredProjects.length === 0 && (
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
    </div>
  );
}