import { statusConfig } from '@/lib/statusConfig';

interface FilterButtonsProps {
  filterStatus: string;
  filterRegion: string;
  filterBranch: string;
  filterClientSpecialist: string;
  filterEnhSpecialist: string;
  onFilterStatusChange: (status: string) => void;
  onFilterRegionChange: (region: string) => void;
  onFilterBranchChange: (branch: string) => void;
  onFilterClientSpecialistChange: (specialist: string) => void;
  onFilterEnhSpecialistChange: (specialist: string) => void;
  regions: string[];
  branches: string[];
  clientSpecialists: string[];
  enhSpecialists: string[];
}

export default function FilterButtons({
  filterStatus,
  filterRegion,
  filterBranch,
  filterClientSpecialist,
  filterEnhSpecialist,
  onFilterStatusChange,
  onFilterRegionChange,
  onFilterBranchChange,
  onFilterClientSpecialistChange,
  onFilterEnhSpecialistChange,
  regions = [],
  branches = [],
  clientSpecialists = [],
  enhSpecialists = [],
}: FilterButtonsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
}