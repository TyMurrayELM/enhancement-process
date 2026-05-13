'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Project, ProjectStatus, MaterialsStatus, getAspireLink } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { materialsConfig } from '@/lib/materialsConfig';
import { getStageRequirements } from '@/utils/requirements';
import { createInitialMeetingCalendarUrl } from '@/lib/calendar';
import { getFieldSupervisorsForRegion } from '@/lib/teamConfig';
import { sendSlackNote } from '@/lib/slack';
import ProjectHistoryView from './projectDetail/ProjectHistoryView';
import ChecklistItemRow from './projectDetail/ChecklistItemRow';
import { ChevronRight, ChevronLeft, Lock, CheckCircle, ExternalLink, Save } from 'lucide-react';
import Image from 'next/image';

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

// Helper to create Google Calendar URL for initial meeting
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
  const [sendingSlack, setSendingSlack] = useState(false);

  const fieldSupervisors = getFieldSupervisorsForRegion(project.regionName);

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

  // Handler to open Google Calendar
  const handleOpenCalendar = () => {
    if (!initialMeetingDate) {
      alert('Please select a meeting date first');
      return;
    }
    
    const calendarUrl = createInitialMeetingCalendarUrl(project, initialMeetingDate);
    window.open(calendarUrl, '_blank');
  };

  const handleSendSlackNotification = async () => {
    if (!stageNotes.trim()) {
      alert('Please enter a note before sending to Slack');
      return;
    }

    setSendingSlack(true);
    try {
      await sendSlackNote({
        project,
        event: 'stage_note_added',
        stage: status.label,
        stageName: project.status,
        note: stageNotes,
        fieldSupervisorOverride: fieldSupervisor || null,
        session,
      });
      alert('✅ Slack notification sent!');
    } catch (error) {
      console.error('Slack notification error:', error);
      alert('❌ Failed to send Slack notification');
    } finally {
      setSendingSlack(false);
    }
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

      const stageHistory =
        project.status !== 'fully_complete'
          ? [
              ...(project.stageHistory || []),
              {
                stage: project.status,
                completedDate: new Date().toISOString(),
                notes: stageNotes || undefined,
                notesBy: stageNotes ? currentUser : undefined,
                notesDate: stageNotes ? currentDate : undefined,
                checklistData: checklist,
              },
            ]
          : project.stageHistory || [];

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
      `Move this project back to "${statusConfig[previousStatus].label}"?\n\nThis will reset the current stage's checklist but preserve historical data.`
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
            <ProjectHistoryView
              project={project}
              onUpdateProject={onUpdateProject}
              onClose={onClose}
            />
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
                  {requirements.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      project={project}
                      checklistEntry={checklist[item.id]}
                      onCheckboxChange={handleCheckboxChange}
                      initialMeetingDate={initialMeetingDate}
                      setInitialMeetingDate={setInitialMeetingDate}
                      onOpenCalendar={handleOpenCalendar}
                      materialsVendors={materialsVendors}
                      setMaterialsVendors={setMaterialsVendors}
                      fieldSupervisor={fieldSupervisor}
                      setFieldSupervisor={setFieldSupervisor}
                      fieldSupervisors={fieldSupervisors}
                      beforePhotoLink={beforePhotoLink}
                      beforePhotoDate={beforePhotoDate}
                      onBeforePhotoChange={handleBeforePhotoChange}
                      progressPhotoLinks={progressPhotoLinks}
                      newProgressLink={newProgressLink}
                      setNewProgressLink={setNewProgressLink}
                      onAddProgressLink={handleAddProgressLink}
                      onRemoveProgressLink={removeProgressLink}
                      completionPhotoLink={completionPhotoLink}
                      completionPhotoDate={completionPhotoDate}
                      onCompletionPhotoChange={handleCompletionPhotoChange}
                    />
                  ))}
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
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {stageNotes.length} characters
                  </p>
                  <button
                    onClick={handleSendSlackNotification}
                    disabled={sendingSlack || !stageNotes.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send note to Slack via Zapier"
                  >
                    <Image
                      src="/icons/slack.png"
                      alt="Slack"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {sendingSlack ? 'Sending...' : 'Send to Slack'}
                    </span>
                  </button>
                </div>
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
