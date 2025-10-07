'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Project, ProjectStatus, MaterialsStatus, getAspireLink } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { materialsConfig } from '@/lib/materialsConfig';
import { getStageRequirements } from '@/utils/requirements';
import { ChevronRight, ChevronLeft, Lock, CheckCircle, History, ExternalLink, Save } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (project: Project) => void;
}

interface ChecklistState {
  [key: string]: {
    completed: boolean;
    completedDate: string | null;
    completedBy?: string;
  };
}

// Helper to get previous stage
function getPreviousStatus(currentStatus: ProjectStatus): ProjectStatus | null {
  const statusOrder: ProjectStatus[] = [
    'proposal_verification',
    'won_planning',
    'in_progress',
    'complete',
    'follow_up',
    'fully_complete'
  ];
  
  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex <= 0) return null;
  return statusOrder[currentIndex - 1];
}

// Helper to calculate warranty follow-up dates
function getFollowUpDate(completedDate: string | undefined, daysToAdd: number): string | null {
  if (!completedDate) return null;
  
  const date = new Date(completedDate);
  date.setDate(date.getDate() + daysToAdd);
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function ProjectDetailModal({ project, onClose, onUpdateProject }: ProjectDetailModalProps) {
  const { data: session } = useSession();
  const status = statusConfig[project.status];
  const requirements = getStageRequirements(project.status, project);
  const isFullyComplete = project.status === 'fully_complete';
  const aspireLink = getAspireLink(project.opportunityId);
  const previousStatus = getPreviousStatus(project.status);
  
  const [checklist, setChecklist] = useState<ChecklistState>(() => {
    const initial: ChecklistState = {};
    requirements.forEach(item => {
      initial[item.id] = project.checklistData?.[item.id] || { 
        completed: false, 
        completedDate: null,
        completedBy: undefined
      };
    });
    return initial;
  });

  // Initialize with existing project data
  const [beforePhotoLink, setBeforePhotoLink] = useState(project.beforePhotoLink || '');
  const [beforePhotoDate, setBeforePhotoDate] = useState<string | null>(project.beforePhotoDate || null);
  const [progressPhotoLinks, setProgressPhotoLinks] = useState<Array<{ link: string; addedDate: string }>>(
    project.progressPhotoLinks || []
  );
  const [completionPhotoLink, setCompletionPhotoLink] = useState(project.completionPhotoLink || '');
  const [completionPhotoDate, setCompletionPhotoDate] = useState<string | null>(project.completionPhotoDate || null);
  const [newProgressLink, setNewProgressLink] = useState('');
  const [initialMeetingDate, setInitialMeetingDate] = useState(
    project.initialMeetingScheduledDate ? new Date(project.initialMeetingScheduledDate).toISOString().split('T')[0] : ''
  );
  const [materialsVendors, setMaterialsVendors] = useState(project.materialsVendors || '');
  const [fieldSupervisor, setFieldSupervisor] = useState(project.fieldSupervisor || '');
  const [stageNotes, setStageNotes] = useState(project.currentStageNotes || '');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Determine field supervisors based on region
  const fieldSupervisors = (() => {
    const region = project.regionName?.toLowerCase() || '';
    if (region.includes('las vegas') || region.includes('vegas')) {
      return ['Adrian Garcia'];
    } else {
      return ['Jose Zacarais', 'Martin Perez', 'Ron Pickard'];
    }
  })();

  const handleBeforePhotoChange = (value: string) => {
    setBeforePhotoLink(value);
    if (value.trim() && !beforePhotoDate) {
      setBeforePhotoDate(new Date().toISOString());
    } else if (!value.trim()) {
      setBeforePhotoDate(null);
    }
  };

  const handleCompletionPhotoChange = (value: string) => {
    setCompletionPhotoLink(value);
    if (value.trim() && !completionPhotoDate) {
      setCompletionPhotoDate(new Date().toISOString());
    } else if (!value.trim()) {
      setCompletionPhotoDate(null);
    }
  };

  const addProgressLink = (link: string) => {
    if (link.trim()) {
      setProgressPhotoLinks([
        ...progressPhotoLinks,
        { link: link.trim(), addedDate: new Date().toISOString() }
      ]);
    }
  };

  const removeProgressLink = (index: number) => {
    setProgressPhotoLinks(progressPhotoLinks.filter((_, i) => i !== index));
  };

  const getCompletedCount = () => {
    let count = 0;
    requirements.forEach(item => {
      if (item.id === 'beforePhotos') {
        if (beforePhotoLink.trim()) count++;
      } else if (item.id === 'progressPhotos') {
        if (progressPhotoLinks.length > 0) count++;
      } else if (item.id === 'completionPhotos') {
        if (completionPhotoLink.trim()) count++;
      } else if (checklist[item.id]?.completed) {
        count++;
      }
    });
    return count;
  };

  const completedCount = getCompletedCount();
  const allComplete = completedCount === requirements.length;
  const nextStatus = status.nextStatus;
  const canAdvance = allComplete && nextStatus !== null;

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setChecklist({
      ...checklist,
      [itemId]: {
        completed: checked,
        completedDate: checked ? new Date().toISOString() : null,
        completedBy: checked ? (session?.user?.email || 'Unknown User') : undefined
      }
    });
  };

  // Save current progress without advancing
  const handleSaveProgress = () => {
    const updatedChecklistData = {
      ...project.checklistData,
      ...checklist
    };

    const currentUser = session?.user?.name || 'Unknown User';
    const currentDate = new Date().toISOString();

    onUpdateProject({
      ...project,
      beforePhotoLink,
      beforePhotoDate: beforePhotoDate || undefined,
      progressPhotoLinks,
      completionPhotoLink,
      completionPhotoDate: completionPhotoDate || undefined,
      initialMeetingScheduledDate: initialMeetingDate || undefined,
      materialsVendors: materialsVendors || undefined,
      fieldSupervisor: fieldSupervisor || undefined,
      currentStageNotes: stageNotes,
      currentStageNotesBy: stageNotes.trim() ? currentUser : undefined,
      currentStageNotesDate: stageNotes.trim() ? currentDate : undefined,
      checklistData: updatedChecklistData,
    });

    // Show success message
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 3000);
  };

  const handleAdvance = () => {
    if (canAdvance && nextStatus) {
      const updatedChecklistData = {
        ...project.checklistData,
        ...checklist
      };

      const currentUser = session?.user?.name || 'Unknown User';
      const currentDate = new Date().toISOString();

      const stageHistory = project.stageHistory || [];
      if (project.status !== 'fully_complete') {
        stageHistory.push({
          stage: project.status,
          completedDate: new Date().toISOString(),
          notes: stageNotes || undefined,
          notesBy: stageNotes ? currentUser : undefined,
          notesDate: stageNotes ? currentDate : undefined,
          checklistData: checklist
        });
      }

      onUpdateProject({
        ...project,
        status: nextStatus as ProjectStatus,
        beforePhotoLink,
        beforePhotoDate: beforePhotoDate || undefined,
        progressPhotoLinks,
        completionPhotoLink,
        completionPhotoDate: completionPhotoDate || undefined,
        initialMeetingScheduledDate: initialMeetingDate || undefined,
        materialsVendors: materialsVendors || undefined,
        fieldSupervisor: fieldSupervisor || undefined,
        currentStageNotes: '', // Clear stage notes when advancing
        currentStageNotesBy: undefined,
        currentStageNotesDate: undefined,
        checklistData: updatedChecklistData,
        stageHistory
      });
      onClose();
    }
  };

  // Move back to previous stage
  const handleMoveToPrevious = () => {
    if (!previousStatus) return;
    
    const confirmed = window.confirm(
      `Move this project back to "${statusConfig[previousStatus].label}"?\n\nThis will reset the current stage\'s checklist but preserve historical data.`
    );
    
    if (!confirmed) return;

    const updatedChecklistData = { ...project.checklistData };
    requirements.forEach(item => {
      delete updatedChecklistData[item.id];
    });

    onUpdateProject({
      ...project,
      status: previousStatus,
      checklistData: updatedChecklistData,
    });
    onClose();
  };

  const handleAddProgressLink = () => {
    if (newProgressLink.trim()) {
      addProgressLink(newProgressLink);
      setNewProgressLink('');
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderHistoryView = () => {
    const allStages: ProjectStatus[] = ['proposal_verification', 'won_planning', 'in_progress', 'complete', 'follow_up'];
    const lastStage: ProjectStatus = 'follow_up';
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          <div>
            <h3 className="font-semibold text-green-900">Project Fully Complete</h3>
            <p className="text-sm text-green-700">All stages completed and archived</p>
          </div>
        </div>

        {/* Move Back Button */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const confirmed = window.confirm(
                `Move this project back to "${statusConfig[lastStage].label}"?\n\nThis will reopen the project for additional work.`
              );
              
              if (!confirmed) return;

              onUpdateProject({
                ...project,
                status: lastStage,
              });
              onClose();
            }}
            className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border border-gray-300"
          >
            <ChevronLeft size={20} />
            Reopen Project - Move to {statusConfig[lastStage].label}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Project History</h3>
          </div>

          {allStages.map((stageKey, index) => {
            const stageConfig = statusConfig[stageKey];
            const stageRequirements = getStageRequirements(stageKey, project);
            const stageData = project.stageHistory?.find(h => h.stage === stageKey);
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
                  {stageRequirements.map(item => {
                    const itemData = stageData?.checklistData?.[item.id] || project.checklistData?.[item.id];
                    const isCompleted = itemData?.completed;

                    if (item.id === 'beforePhotos' && project.beforePhotoLink) {
                      return (
                        <div key={item.id} className="p-3 bg-white rounded border border-gray-200">
                          <div className="flex items-start gap-3 mb-2">
                            <CheckCircle className="text-green-600" size={18} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900 font-medium">
                                  {item.label}
                                </span>
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
                              <span className="text-sm text-gray-900 font-medium">
                                {item.label}
                              </span>
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
                                <span className="text-sm text-gray-900 font-medium">
                                  {item.label}
                                </span>
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
                                  <span className="text-xs text-gray-500 block">
                                    {itemData.completedBy}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {item.id === 'materials' && project.materialsVendors && (
                            <div className="mt-1 text-xs text-gray-600">
                              Vendor(s): {project.materialsVendors}
                            </div>
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

                {index < allStages.length - 1 && (
                  <div className="ml-4 mt-3 mb-3 h-6 w-0.5 bg-gray-300"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-300">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{project.clientName}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Current Stage: <span className="font-medium">{status.label}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {aspireLink && (
                <a
                  href={aspireLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <ExternalLink size={16} />
                  Open in Aspire
                </a>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-600">Project Value</p>
              <p className="text-lg font-semibold text-gray-900">${project.value.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Account Manager</p>
              <p className="text-sm font-medium text-gray-900">{project.accountManager}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Specialist</p>
              <p className="text-sm font-medium text-gray-900">{project.specialist}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(project.createdDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Materials Status Selector */}
          {!isFullyComplete && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Materials Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(materialsConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onUpdateProject({
                          ...project,
                          materialsStatus: key as MaterialsStatus
                        });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        project.materialsStatus === key
                          ? config.color + ' border-current font-semibold'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isFullyComplete ? (
            renderHistoryView()
          ) : (
            <>
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Stage Requirements</h3>
                  <span className="text-sm font-medium text-gray-700">
                    {completedCount} of {requirements.length} complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${allComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ width: `${(completedCount / requirements.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Tasks</h3>
                <div className="space-y-3">
                  {requirements.map((item) => {
                    // Get warranty follow-up dates if this is a warranty period task
                    let dueDate: string | null = null;
                    if (project.status === 'follow_up' && project.completedDate) {
                      if (item.id === 'weekOneInspection') {
                        dueDate = getFollowUpDate(project.completedDate, 7);
                      } else if (item.id === 'month1Visit') {
                        dueDate = getFollowUpDate(project.completedDate, 30);
                      } else if (item.id === 'month2Visit') {
                        dueDate = getFollowUpDate(project.completedDate, 60);
                      } else if (item.id === 'month3Visit') {
                        dueDate = getFollowUpDate(project.completedDate, 90);
                      }
                    }

                    return (
                      <div key={item.id}>
                        {item.id === 'schedInitialMeeting' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={checklist[item.id]?.completed || false}
                                onChange={(e) => {
                                  if (e.target.checked && !initialMeetingDate.trim()) {
                                    alert('Please select a date before checking this item');
                                    return;
                                  }
                                  handleCheckboxChange(item.id, e.target.checked);
                                }}
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {checklist[item.id]?.completedDate && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {formatDate(checklist[item.id].completedDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date:</label>
                              <input
                                type="date"
                                value={initialMeetingDate}
                                onChange={(e) => setInitialMeetingDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              />
                              {initialMeetingDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Selected: {new Date(initialMeetingDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : item.id === 'materials' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={checklist[item.id]?.completed || false}
                                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {checklist[item.id]?.completedDate && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {formatDate(checklist[item.id].completedDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor(s):</label>
                              <input
                                type="text"
                                value={materialsVendors}
                                onChange={(e) => setMaterialsVendors(e.target.value)}
                                placeholder="Enter vendor name(s)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              />
                              {materialsVendors && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Vendor(s): {materialsVendors}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : item.id === 'fsassigned' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={checklist[item.id]?.completed || false}
                                onChange={(e) => {
                                  if (e.target.checked && !fieldSupervisor.trim()) {
                                    alert('Please select a field supervisor before checking this item');
                                    return;
                                  }
                                  handleCheckboxChange(item.id, e.target.checked);
                                }}
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {checklist[item.id]?.completedDate && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {formatDate(checklist[item.id].completedDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Field Supervisor:</label>
                              <select
                                value={fieldSupervisor}
                                onChange={(e) => setFieldSupervisor(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              >
                                <option value="">Select a field supervisor...</option>
                                {fieldSupervisors.map((supervisor) => (
                                  <option key={supervisor} value={supervisor}>
                                    {supervisor}
                                  </option>
                                ))}
                              </select>
                              {fieldSupervisor && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned: {fieldSupervisor}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : item.id === 'beforePhotos' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={beforePhotoLink.trim() !== ''}
                                readOnly
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {beforePhotoDate && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {formatDate(beforePhotoDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Google Photos Link:</label>
                              <input
                                type="url"
                                value={beforePhotoLink}
                                onChange={(e) => handleBeforePhotoChange(e.target.value)}
                                placeholder="Paste Google Photos link here..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              />
                              {beforePhotoLink.trim() && (
                                <a href={beforePhotoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:text-green-700 mt-1 inline-block"
                                >
                                  View Photos →
                                </a>
                              )}
                            </div>
                          </div>
                        ) : item.id === 'progressPhotos' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={progressPhotoLinks.length > 0}
                                readOnly
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{item.label}</span>
                                <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg space-y-2">
                              {progressPhotoLinks.map((photoSet, index) => (
                                <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                  <div className="flex-1">
                                    <a href={photoSet.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-green-600 hover:text-green-700 block truncate"
                                    >
                                      Progress Set {index + 1} →
                                    </a>
                                    <span className="text-xs text-gray-500">
                                      Added: {formatDate(photoSet.addedDate)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeProgressLink(index)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}

                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={newProgressLink}
                                  onChange={(e) => setNewProgressLink(e.target.value)}
                                  placeholder="Paste Google Photos link..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                />
                                <button
                                  onClick={handleAddProgressLink}
                                  disabled={!newProgressLink.trim()}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : item.id === 'completionPhotos' ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={completionPhotoLink.trim() !== ''}
                                readOnly
                                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {completionPhotoDate && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {formatDate(completionPhotoDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-8 bg-gray-50 p-3 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Google Photos Link:</label>
                              <input
                                type="url"
                                value={completionPhotoLink}
                                onChange={(e) => handleCompletionPhotoChange(e.target.value)}
                                placeholder="Paste Google Photos link here..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              />
                              {completionPhotoLink.trim() && (
                                <a href={completionPhotoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:text-green-700 mt-1 inline-block"
                                >
                                  View Photos →
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <input
                              type="checkbox"
                              checked={checklist[item.id]?.completed || false}
                              onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                              className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <div>
                                    <span className="text-gray-900 font-medium">{item.label}</span>
                                    <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>
                                  </div>
                                  {dueDate && (
                                    <span className="text-xs text-blue-600 font-medium mt-1">
                                      Due: {dueDate}
                                    </span>
                                  )}
                                </div>
                                {checklist[item.id]?.completedDate && (
                                  <div className="text-right">
                                    <span className="text-xs text-green-600 font-medium block">
                                      ✓ {formatDate(checklist[item.id].completedDate)}
                                    </span>
                                    {checklist[item.id]?.completedBy && (
                                      <span className="text-xs text-gray-500 block">
                                        {checklist[item.id].completedBy}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage Notes Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stage Notes</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add notes specific to the {status.label} stage. These will be saved with this stage&apos;s history.
                </p>
                <textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder={`Add notes for ${status.label}...`}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {stageNotes.length} characters
                </p>
              </div>

              {/* Save Success Message */}
              {showSaveSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Progress Saved!</p>
                    <p className="text-xs text-green-700">Your changes have been saved successfully.</p>
                  </div>
                </div>
              )}

              {!allComplete && nextStatus && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Lock className="text-yellow-700 mt-1" size={20} />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Stage Locked</h4>
                      <p className="text-sm text-yellow-800">
                        Complete all required tasks above to advance to <strong>{statusConfig[nextStatus].label}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {previousStatus && (
                  <button
                    onClick={handleMoveToPrevious}
                    className="px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border border-gray-300"
                  >
                    <ChevronLeft size={20} />
                    Back to {statusConfig[previousStatus].label}
                  </button>
                )}
                
                {canAdvance && nextStatus ? (
                  <button
                    onClick={handleAdvance}
                    className="flex-1 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    Complete & Advance to {statusConfig[nextStatus].label}
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProgress}
                    className="flex-1 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save size={16} />
                    Save Progress
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="px-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>

              {nextStatus && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Next Stage: {statusConfig[nextStatus].label}
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {getStageRequirements(nextStatus, project).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        {item.label}
                      </div>
                    ))}
                    {getStageRequirements(nextStatus, project).length > 3 && (
                      <div className="text-gray-500 italic">
                        + {getStageRequirements(nextStatus, project).length - 3} more tasks...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}