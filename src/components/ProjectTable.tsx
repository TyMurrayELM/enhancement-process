import { useState } from 'react';
import { Project, getAspireLink } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { materialsConfig } from '@/lib/materialsConfig';
import { CheckCircle, ExternalLink, Play, FileText, Check } from 'lucide-react';
import Image from 'next/image';
import NotesModal from './NotesModal';

interface ProjectTableProps {
  projects: Project[];
  onViewDetails: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
}

// Map branch names to icon filenames
function getBranchIcon(branchName?: string): string | null {
  if (!branchName) return null;
  
  const normalized = branchName.toLowerCase();
  
  if (normalized.includes('las vegas')) return '/icons/branches/fab_lv.png';
  if (normalized.includes('southwest') || normalized.includes('south west')) return '/icons/branches/phx_sw.png';
  if (normalized.includes('southeast') || normalized.includes('south east')) return '/icons/branches/phx_se.png';
  if (normalized.includes('north')) return '/icons/branches/phx_n.png';
  if (normalized.includes('corporate')) return '/icons/branches/corp.png';
  
  return null;
}

// Check if won date is today in Arizona time
function isWonToday(wonDate?: string | null): boolean {
  if (!wonDate) return false;
  
  // Get current date in Arizona timezone (UTC-7)
  const now = new Date();
  const arizonaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const todayAZ = `${arizonaDate.getFullYear()}-${String(arizonaDate.getMonth() + 1).padStart(2, '0')}-${String(arizonaDate.getDate()).padStart(2, '0')}`;
  
  // Convert won date (which is in UTC) to Arizona time
  const wonDateObj = new Date(wonDate);
  const wonDateAZ = new Date(wonDateObj.toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const wonDateOnly = `${wonDateAZ.getFullYear()}-${String(wonDateAZ.getMonth() + 1).padStart(2, '0')}-${String(wonDateAZ.getDate()).padStart(2, '0')}`;
  
  console.log('Checking won date:', wonDate, 'Today in AZ:', todayAZ, 'Won date in AZ:', wonDateOnly, 'Match:', todayAZ === wonDateOnly);
  
  return todayAZ === wonDateOnly;
}

export default function ProjectTable({ projects, onViewDetails, onUpdateProject }: ProjectTableProps) {
  const [notesProject, setNotesProject] = useState<Project | null>(null);
  const [materialsDropdownOpen, setMaterialsDropdownOpen] = useState<number | null>(null);

  const handleSaveNotes = async (updatedProject: Project, notes: string) => {
    onUpdateProject(updatedProject);
  };

  const handleMaterialsStatusChange = (project: Project, newStatus: string) => {
    onUpdateProject({
      ...project,
      materialsStatus: newStatus as any
    });
    setMaterialsDropdownOpen(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                WO#
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Property
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Opp Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Est $'s
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Client Specialist
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Enh Specialist
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sched Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Won Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              const materialsStatus = materialsConfig[project.materialsStatus || 'need_to_order'];
              const MaterialsIcon = materialsStatus.icon;
              const progress = project.checklistProgress;
              const isComplete = progress.completed === progress.total;
              const aspireLink = getAspireLink(project.opportunityId);
              const branchIcon = getBranchIcon(project.branchName);
              const isNew = isWonToday(project.wonDate);

              const hasCompletedDate = project.completedDate != null;
              const hasActualHours = project.actualLaborHours && project.actualLaborHours > 0;
              const hasEstimatedHours = project.estimatedLaborHours && project.estimatedLaborHours > 0;
              
              // Check for ALL notes (general + stage notes)
              const notesCount = (() => {
                let count = 0;
                if (project.notes?.trim()) count++; // General project notes
                if (project.currentStageNotes?.trim()) count++; // Current stage notes
                if (project.stageHistory) {
                  count += project.stageHistory.filter(s => s.notes?.trim()).length; // Historical stage notes
                }
                return count;
              })();
              const hasAnyNotes = notesCount > 0;
              
              let hoursColor = 'bg-gray-100 text-gray-600';
              if (hasCompletedDate) {
                hoursColor = 'bg-green-50 text-green-800';
              } else if (hasActualHours && hasEstimatedHours) {
                hoursColor = (project.actualLaborHours ?? 0) > (project.estimatedLaborHours ?? 0)
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700';
              }

              return (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* WO# Column - Changed to text-xs */}
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">
                    <div className="flex flex-col gap-1">
                      {aspireLink ? (
                        <a
                          href={aspireLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {project.aspireWoNumber || `#${project.id}`}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span>{project.aspireWoNumber || `#${project.id}`}</span>
                      )}
                      {isNew && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase w-fit">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Property Column - Changed to text-xs */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {branchIcon && (
                        <div className="flex-shrink-0">
                          <Image
                            src={branchIcon}
                            alt={project.branchName || 'Branch'}
                            width={24}
                            height={24}
                            className="rounded"
                            title={project.branchName}
                          />
                        </div>
                      )}
                      <div className="text-xs font-medium text-gray-900">
                        {project.clientName}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <div className="flex flex-col gap-1">
                      <span>{project.oppName || '-'}</span>
                      {hasEstimatedHours && (
                        <div 
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap w-fit ${hoursColor}`}
                          title={
                            hasCompletedDate 
                              ? "Completed in Aspire" 
                              : hasActualHours 
                                ? "Actual vs Estimated labor hours" 
                                : "Estimated labor hours (not started)"
                          }
                        >
                          {hasCompletedDate ? (
                            <Check size={12} strokeWidth={3} />
                          ) : (
                            hasActualHours && <Play size={10} fill="currentColor" />
                          )}
                          {hasActualHours 
                            ? `${project.actualLaborHours?.toFixed(1)} / ${project.estimatedLaborHours?.toFixed(1)} hrs`
                            : `0 / ${project.estimatedLaborHours?.toFixed(1)} hrs`
                          }
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {/* Materials Status - Clickable Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            setMaterialsDropdownOpen(materialsDropdownOpen === project.id ? null : project.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors hover:opacity-80 ${materialsStatus.color}`}
                        >
                          <MaterialsIcon size={20} />
                          {materialsStatus.label}
                        </button>
                        
                        {/* Dropdown Menu */}
                        {materialsDropdownOpen === project.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setMaterialsDropdownOpen(null)}
                            />
                            {/* Dropdown content - positioned to open upward */}
                            <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              {Object.entries(materialsConfig).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                  <button
                                    key={key}
                                    onClick={() => handleMaterialsStatusChange(project, key)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                      project.materialsStatus === key ? 'font-semibold' : ''
                                    }`}
                                  >
                                    <Icon size={14} className={config.color.split(' ')[1]} />
                                    <span>{config.label}</span>
                                    {project.materialsStatus === key && (
                                      <CheckCircle size={14} className="ml-auto text-green-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-blue-600">
                        ${project.value.toLocaleString()}
                      </span>
                      {project.estimatedGrossMarginPercent != null && (
                        <span className="text-xs text-gray-600">
                          {project.estimatedGrossMarginPercent.toFixed(1)}% GM
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {project.accountManager}
                  </td>
                  
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {project.specialist}
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-700 w-24">
                    {project.scheduledDate ? (
                      new Date(project.scheduledDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    ) : (
                      <span className="text-gray-400">Not scheduled</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-700 w-24">
                    {project.wonDate ? (
                      new Date(project.wonDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete ? 'bg-blue-600' : 'bg-blue-500'
                            }`}
                            style={{ 
                              width: `${(progress.completed / progress.total) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium whitespace-nowrap ${
                          isComplete ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {progress.completed}/{progress.total}
                        </span>
                        {isComplete && (
                          <CheckCircle size={14} className="text-blue-600" />
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setNotesProject(project)}
                        className={`p-2 rounded-md transition-colors relative ${
                          hasAnyNotes
                            ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        title={
                          hasAnyNotes
                            ? `${notesCount} note${notesCount > 1 ? 's' : ''} on this project`
                            : 'Add Notes'
                        }
                      >
                        <FileText 
                          size={20} 
                          strokeWidth={2}
                          fill="none"
                        />
                        {hasAnyNotes && (
                          <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {notesCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => onViewDetails(project)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found</p>
        </div>
      )}
    </div>

    {/* Notes Modal */}
    {notesProject && (
      <NotesModal
        project={notesProject}
        onClose={() => setNotesProject(null)}
        onSave={handleSaveNotes}
      />
    )}
  </>
  );
}