import { statusConfig } from '@/lib/statusConfig';
import { Search, X, User } from 'lucide-react';

interface FilterButtonsProps {
  filterStatus: string;
  filterRegion: string;
  filterBranch: string;
  filterClientSpecialist: string;
  filterEnhSpecialist: string;
  filterFieldSupervisor: string;
  filterSearch: string;
  filterMine: boolean;
  onFilterStatusChange: (status: string) => void;
  onFilterRegionChange: (region: string) => void;
  onFilterBranchChange: (branch: string) => void;
  onFilterClientSpecialistChange: (specialist: string) => void;
  onFilterEnhSpecialistChange: (specialist: string) => void;
  onFilterFieldSupervisorChange: (supervisor: string) => void;
  onFilterSearchChange: (q: string) => void;
  onFilterMineChange: (mine: boolean) => void;
  regions: string[];
  branches: string[];
  clientSpecialists: string[];
  enhSpecialists: string[];
  fieldSupervisors: string[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  canFilterMine: boolean;
}

export default function FilterButtons({
  filterStatus,
  filterRegion,
  filterBranch,
  filterClientSpecialist,
  filterEnhSpecialist,
  filterFieldSupervisor,
  filterSearch,
  filterMine,
  onFilterStatusChange,
  onFilterRegionChange,
  onFilterBranchChange,
  onFilterClientSpecialistChange,
  onFilterEnhSpecialistChange,
  onFilterFieldSupervisorChange,
  onFilterSearchChange,
  onFilterMineChange,
  regions = [],
  branches = [],
  clientSpecialists = [],
  enhSpecialists = [],
  fieldSupervisors = [],
  totalCount,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
  canFilterMine,
}: FilterButtonsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search + My Projects + Counter + Clear */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => onFilterSearchChange(e.target.value)}
            placeholder="Search by WO#, property, or opportunity..."
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          />
          {filterSearch && (
            <button
              onClick={() => onFilterSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {canFilterMine && (
          <button
            onClick={() => onFilterMineChange(!filterMine)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filterMine
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Show only projects where I'm the Client Specialist, Enh Specialist, or Field Supervisor"
          >
            <User size={16} />
            My projects
          </button>
        )}

        <div className="text-sm text-gray-600 ml-auto whitespace-nowrap">
          Showing <span className="font-semibold text-gray-900">{filteredCount}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalCount}</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300"
            title="Reset all filters"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Stage Filter Buttons */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Stage
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onFilterStatusChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Active Projects
          </button>
          {Object.entries(statusConfig)
            .filter(([key]) => key !== 'proposal') // Hide proposal stage
            .map(([key, config]) => (
              <button
                key={key}
                onClick={() => onFilterStatusChange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {config.label}
              </button>
            ))}
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Region Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Region
          </label>
          <select
            value={filterRegion}
            onChange={(e) => onFilterRegionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Branch
          </label>
          <select
            value={filterBranch}
            onChange={(e) => onFilterBranchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {/* Client Specialist Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Client Specialist
          </label>
          <select
            value={filterClientSpecialist}
            onChange={(e) => onFilterClientSpecialistChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Client Specialists</option>
            {clientSpecialists.map((specialist) => (
              <option key={specialist} value={specialist}>
                {specialist}
              </option>
            ))}
          </select>
        </div>

        {/* Enhancement Specialist Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Enh Specialist
          </label>
          <select
            value={filterEnhSpecialist}
            onChange={(e) => onFilterEnhSpecialistChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Enh Specialists</option>
            {enhSpecialists.map((specialist) => (
              <option key={specialist} value={specialist}>
                {specialist}
              </option>
            ))}
          </select>
        </div>

        {/* Field Supervisor Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Field Supervisor
          </label>
          <select
            value={filterFieldSupervisor}
            onChange={(e) => onFilterFieldSupervisorChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Field Supervisors</option>
            {fieldSupervisors.map((supervisor) => (
              <option key={supervisor} value={supervisor}>
                {supervisor}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}