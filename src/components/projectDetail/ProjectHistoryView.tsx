'use client';

import { Project, ProjectStatus } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { getStageRequirements } from '@/utils/requirements';
import { formatDate } from '@/lib/format';
import { ChevronLeft, CheckCircle, History } from 'lucide-react';

const ALL_STAGES: ProjectStatus[] = [
  'proposal_verification',
  'won_planning',
  'in_progress',
  'complete',
  'follow_up',
];
const LAST_STAGE: ProjectStatus = 'follow_up';

interface Props {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClose: () => void;
}

export default function ProjectHistoryView({ project, onUpdateProject, onClose }: Props) {
  const handleReopen = () => {
    const confirmed = window.confirm(
      `Move this project back to "${statusConfig[LAST_STAGE].label}"?\n\nThis will reopen the project for additional work.`,
    );
    if (!confirmed) return;
    onUpdateProject({ ...project, status: LAST_STAGE });
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="text-green-600" size={24} />
        <div>
          <h3 className="font-semibold text-green-900">Project Fully Complete</h3>
          <p className="text-sm text-green-700">All stages completed and archived</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReopen}
          className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border border-gray-300"
        >
          <ChevronLeft size={20} />
          Reopen Project - Move to {statusConfig[LAST_STAGE].label}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Project History</h3>
        </div>

        {ALL_STAGES.map((stageKey, index) => {
          const stageConfig = statusConfig[stageKey];
          const stageRequirements = getStageRequirements(stageKey, project);
          const stageData = project.stageHistory?.find((h) => h.stage === stageKey);
          const StageIcon = stageConfig.icon;

          return (
            <div key={stageKey} className="mb-6 last:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${stageConfig.color} flex items-center justify-center`}>
                  <StageIcon size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{stageConfig.label}</h4>
                  {stageData && (
                    <p className="text-xs text-gray-500">
                      Completed: {formatDate(stageData.completedDate)}
                    </p>
                  )}
                  {stageData?.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                      <span className="font-semibold text-yellow-800">Notes: </span>
                      {stageData.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-11 space-y-2">
                {stageRequirements.map((item) => {
                  const itemData = stageData?.checklistData?.[item.id] || project.checklistData?.[item.id];
                  const isCompleted = itemData?.completed;

                  if (item.id === 'beforePhotos' && project.beforePhotoLink) {
                    return (
                      <div key={item.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-start gap-3 mb-2">
                          <CheckCircle className="text-green-600" size={18} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-medium">{item.label}</span>
                              {project.beforePhotoDate && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ {formatDate(project.beforePhotoDate)}
                                </span>
                              )}
                            </div>
                            <a
                              href={project.beforePhotoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                            >
                              View Before Photos →
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.id === 'progressPhotos' && project.progressPhotoLinks && project.progressPhotoLinks.length > 0) {
                    return (
                      <div key={item.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-start gap-3 mb-2">
                          <CheckCircle className="text-green-600" size={18} />
                          <div className="flex-1">
                            <span className="text-sm text-gray-900 font-medium">{item.label}</span>
                          </div>
                        </div>
                        <div className="ml-6 space-y-1">
                          {project.progressPhotoLinks.map((photoSet, idx) => (
                            <div key={idx}>
                              <a
                                href={photoSet.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 block"
                              >
                                Progress Set {idx + 1} →
                              </a>
                              <span className="text-xs text-gray-500">
                                Added: {formatDate(photoSet.addedDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (item.id === 'completionPhotos' && project.completionPhotoLink) {
                    return (
                      <div key={item.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-start gap-3 mb-2">
                          <CheckCircle className="text-green-600" size={18} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-medium">{item.label}</span>
                              {project.completionPhotoDate && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ {formatDate(project.completionPhotoDate)}
                                </span>
                              )}
                            </div>
                            <a
                              href={project.completionPhotoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                            >
                              View Completion Photos →
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-200">
                      <CheckCircle
                        className={isCompleted ? 'text-green-600' : 'text-gray-300'}
                        size={18}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {item.label}
                          </span>
                          {isCompleted && itemData?.completedDate && (
                            <div className="text-right">
                              <span className="text-xs text-green-600 font-medium block">
                                ✓ {formatDate(itemData.completedDate)}
                              </span>
                              {itemData?.completedBy && (
                                <span className="text-xs text-gray-500 block">{itemData.completedBy}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {item.id === 'materials' && project.materialsVendors && (
                          <div className="mt-1 text-xs text-gray-600">Vendor(s): {project.materialsVendors}</div>
                        )}
                        {item.id === 'fsassigned' && project.fieldSupervisor && (
                          <div className="mt-1 text-xs text-gray-600">
                            Field Supervisor: {project.fieldSupervisor}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {index < ALL_STAGES.length - 1 && (
                <div className="ml-4 mt-3 mb-3 h-6 w-0.5 bg-gray-300"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
