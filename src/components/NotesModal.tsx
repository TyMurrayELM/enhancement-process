'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { Save, X, Edit2, Check } from 'lucide-react';
import Image from 'next/image';

interface NotesModalProps {
  project: Project;
  onClose: () => void;
  onSave: (project: Project, notes: string) => void;
}

export default function NotesModal({ project, onClose, onSave }: NotesModalProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState(project.notes || '');
  const [currentStageNotes, setCurrentStageNotes] = useState(project.currentStageNotes || '');
  const [stageHistory, setStageHistory] = useState(project.stageHistory || []);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [editingStageNoteText, setEditingStageNoteText] = useState('');
  const [isEditingCurrentStage, setIsEditingCurrentStage] = useState(false);
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [sendingSlackStage, setSendingSlackStage] = useState(false);
  const [sendingSlackGeneral, setSendingSlackGeneral] = useState(false);
  const [sendingSlackHistory, setSendingSlackHistory] = useState<number | null>(null);

  const handleSaveCurrentStageNotes = async () => {
    setIsSavingStage(true);
    try {
      const currentUser = session?.user?.name || 'Current User';
      const currentDate = new Date().toISOString();
      
      const updatedProject = {
        ...project,
        currentStageNotes,
        currentStageNotesBy: currentStageNotes.trim() ? currentUser : undefined,
        currentStageNotesDate: currentStageNotes.trim() ? currentDate : undefined,
      };
      
      await onSave(updatedProject, project.notes || '');
      // Update local state to reflect saved changes
      project.currentStageNotes = currentStageNotes;
      project.currentStageNotesBy = currentStageNotes.trim() ? currentUser : undefined;
      project.currentStageNotesDate = currentStageNotes.trim() ? currentDate : undefined;
      setIsEditingCurrentStage(false);
    } catch (error) {
      console.error('Failed to save stage notes:', error);
      alert('Failed to save stage notes');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleSaveGeneralNotes = async () => {
    setIsSavingGeneral(true);
    try {
      const currentUser = session?.user?.name || 'Current User';
      const currentDate = new Date().toISOString();
      
      const updatedProject = {
        ...project,
        notes,
        notesBy: notes.trim() ? currentUser : undefined,
        notesDate: notes.trim() ? currentDate : undefined,
      };
      
      await onSave(updatedProject, notes);
      // Update local state to reflect saved changes
      project.notes = notes;
      project.notesBy = notes.trim() ? currentUser : undefined;
      project.notesDate = notes.trim() ? currentDate : undefined;
      setIsEditingGeneral(false);
    } catch (error) {
      console.error('Failed to save general notes:', error);
      alert('Failed to save general notes');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleEditStageNote = (index: number) => {
    if (stageHistory && stageHistory[index]) {
      setEditingStageIndex(index);
      setEditingStageNoteText(stageHistory[index].notes || '');
    }
  };

  const handleSaveStageNote = async () => {
    if (editingStageIndex !== null && stageHistory) {
      const currentUser = session?.user?.name || 'Current User';
      const currentDate = new Date().toISOString();
      
      const updatedStageHistory = [...stageHistory];
      updatedStageHistory[editingStageIndex] = {
        ...updatedStageHistory[editingStageIndex],
        notes: editingStageNoteText.trim() || undefined,
        notesBy: editingStageNoteText.trim() ? currentUser : undefined,
        notesDate: editingStageNoteText.trim() ? currentDate : undefined,
      };
      
      // Save to database
      const updatedProject = {
        ...project,
        stageHistory: updatedStageHistory,
      };
      
      await onSave(updatedProject, project.notes || '');
      setStageHistory(updatedStageHistory);
      setEditingStageIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingStageIndex(null);
    setEditingStageNoteText('');
  };

  const handleCancelCurrentStageEdit = () => {
    setCurrentStageNotes(project.currentStageNotes || '');
    setIsEditingCurrentStage(false);
  };

  const handleCancelGeneralEdit = () => {
    setNotes(project.notes || '');
    setIsEditingGeneral(false);
  };

  // Send Current Stage Notes to Slack
  const handleSendSlackStage = async () => {
    if (!currentStageNotes.trim()) {
      alert('Please enter a note before sending to Slack');
      return;
    }

    setSendingSlackStage(true);
    try {
      const aspireDirectLink = project.opportunityId 
        ? `https://cloud.youraspire.com/app/opportunities/details/${project.opportunityId}`
        : null;

      // Map branch name to Slack emoji
      const getBranchEmoji = (branchName?: string): string | null => {
        if (!branchName) return null;
        const normalized = branchName.toLowerCase();
        
        if (normalized.includes('las vegas')) return ':fab_lv:';
        if (normalized.includes('southwest') || normalized.includes('south west')) return ':sw:';
        if (normalized.includes('southeast') || normalized.includes('south east')) return ':se:';
        if (normalized.includes('north')) return ':n:';
        if (normalized.includes('corporate') || normalized.includes('corp')) return ':corp:';
        
        return null;
      };

      const status = statusConfig[project.status];

      const payload = {
        event: 'stage_note_added',
        stage: status.label,
        stageName: project.status,
        note: currentStageNotes,
        projectNumber: project.aspireWoNumber || `ID-${project.id}`,
        opportunityId: project.opportunityId,
        aspireLink: aspireDirectLink,
        propertyName: project.clientName,
        oppName: project.oppName,
        accountManager: project.accountManager,
        specialist: project.specialist,
        fieldSupervisor: project.fieldSupervisor || null,
        value: project.value,
        branchName: project.branchName,
        branchEmoji: getBranchEmoji(project.branchName),
        regionName: project.regionName,
        sentBy: session?.user?.name || session?.user?.email || 'Unknown User',
        sentByEmail: session?.user?.email || null,
        sentAt: new Date().toISOString(),
        projectUrl: `${window.location.origin}`
      };

      const response = await fetch('/api/zapier-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert('✅ Slack notification sent!');
    } catch (error) {
      console.error('Slack notification error:', error);
      alert('❌ Failed to send Slack notification');
    } finally {
      setSendingSlackStage(false);
    }
  };

  // Send General Notes to Slack
  const handleSendSlackGeneral = async () => {
    if (!notes.trim()) {
      alert('Please enter a note before sending to Slack');
      return;
    }

    setSendingSlackGeneral(true);
    try {
      const aspireDirectLink = project.opportunityId 
        ? `https://cloud.youraspire.com/app/opportunities/details/${project.opportunityId}`
        : null;

      // Map branch name to Slack emoji
      const getBranchEmoji = (branchName?: string): string | null => {
        if (!branchName) return null;
        const normalized = branchName.toLowerCase();
        
        if (normalized.includes('las vegas')) return ':fab_lv:';
        if (normalized.includes('southwest') || normalized.includes('south west')) return ':sw:';
        if (normalized.includes('southeast') || normalized.includes('south east')) return ':se:';
        if (normalized.includes('north')) return ':n:';
        if (normalized.includes('corporate') || normalized.includes('corp')) return ':corp:';
        
        return null;
      };

      const payload = {
        event: 'general_note_added',
        stage: 'General Project Notes',
        stageName: 'general',
        note: notes,
        projectNumber: project.aspireWoNumber || `ID-${project.id}`,
        opportunityId: project.opportunityId,
        aspireLink: aspireDirectLink,
        propertyName: project.clientName,
        oppName: project.oppName,
        accountManager: project.accountManager,
        specialist: project.specialist,
        fieldSupervisor: project.fieldSupervisor || null,
        value: project.value,
        branchName: project.branchName,
        branchEmoji: getBranchEmoji(project.branchName),
        regionName: project.regionName,
        sentBy: session?.user?.name || session?.user?.email || 'Unknown User',
        sentByEmail: session?.user?.email || null,
        sentAt: new Date().toISOString(),
        projectUrl: `${window.location.origin}`
      };

      const response = await fetch('/api/zapier-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert('✅ Slack notification sent!');
    } catch (error) {
      console.error('Slack notification error:', error);
      alert('❌ Failed to send Slack notification');
    } finally {
      setSendingSlackGeneral(false);
    }
  };

  // Send Historical Stage Notes to Slack
  const handleSendSlackHistory = async (index: number) => {
    const stage = stageHistory[index];
    if (!stage || !stage.notes?.trim()) {
      alert('No note to send');
      return;
    }

    setSendingSlackHistory(index);
    try {
      const aspireDirectLink = project.opportunityId 
        ? `https://cloud.youraspire.com/app/opportunities/details/${project.opportunityId}`
        : null;

      // Map branch name to Slack emoji
      const getBranchEmoji = (branchName?: string): string | null => {
        if (!branchName) return null;
        const normalized = branchName.toLowerCase();
        
        if (normalized.includes('las vegas')) return ':fab_lv:';
        if (normalized.includes('southwest') || normalized.includes('south west')) return ':sw:';
        if (normalized.includes('southeast') || normalized.includes('south east')) return ':se:';
        if (normalized.includes('north')) return ':n:';
        if (normalized.includes('corporate') || normalized.includes('corp')) return ':corp:';
        
        return null;
      };

      const stageConfig = statusConfig[stage.stage];

      const payload = {
        event: 'stage_note_added',
        stage: stageConfig.label,
        stageName: stage.stage,
        note: stage.notes,
        projectNumber: project.aspireWoNumber || `ID-${project.id}`,
        opportunityId: project.opportunityId,
        aspireLink: aspireDirectLink,
        propertyName: project.clientName,
        oppName: project.oppName,
        accountManager: project.accountManager,
        specialist: project.specialist,
        fieldSupervisor: project.fieldSupervisor || null,
        value: project.value,
        branchName: project.branchName,
        branchEmoji: getBranchEmoji(project.branchName),
        regionName: project.regionName,
        sentBy: session?.user?.name || session?.user?.email || 'Unknown User',
        sentByEmail: session?.user?.email || null,
        sentAt: new Date().toISOString(),
        projectUrl: `${window.location.origin}`
      };

      const response = await fetch('/api/zapier-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert('✅ Slack notification sent!');
    } catch (error) {
      console.error('Slack notification error:', error);
      alert('❌ Failed to send Slack notification');
    } finally {
      setSendingSlackHistory(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Project Notes</h2>
              <p className="text-sm text-gray-600 mt-1">
                {project.clientName} - WO {project.aspireWoNumber || `#${project.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Stage History Notes */}
          {stageHistory && stageHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage Notes History</h3>
              <div className="space-y-3">
                {stageHistory.map((stage, index) => {
                  if (!stage.notes && editingStageIndex !== index) return null;
                  const stageConfig = statusConfig[stage.stage];
                  const StageIcon = stageConfig.icon;
                  const isEditing = editingStageIndex === index;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded ${stageConfig.color} flex items-center justify-center`}>
                            <StageIcon size={14} />
                          </div>
                          <span className="font-semibold text-gray-900">{stageConfig.label}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(stage.completedDate)}
                          </span>
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => handleEditStageNote(index)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingStageNoteText}
                            onChange={(e) => setEditingStageNoteText(e.target.value)}
                            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveStageNote}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{stage.notes}</p>
                          {stage.notesBy && (
                            <p className="text-xs text-gray-500 mt-2">
                              by {stage.notesBy} {stage.notesDate && `• ${formatDate(stage.notesDate)}`}
                            </p>
                          )}
                          <div className="mt-3">
                            <button
                              onClick={() => handleSendSlackHistory(index)}
                              disabled={sendingSlackHistory === index}
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
                                {sendingSlackHistory === index ? 'Sending...' : 'Send to Slack'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Stage Notes */}
          {project.status !== 'fully_complete' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Current Stage Notes</h3>
                {!isEditingCurrentStage && (
                  <button
                    onClick={() => setIsEditingCurrentStage(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                )}
              </div>
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded ${statusConfig[project.status].color} flex items-center justify-center`}>
                    {(() => {
                      const StageIcon = statusConfig[project.status].icon;
                      return <StageIcon size={14} />;
                    })()}
                  </div>
                  <span className="font-semibold text-gray-900">{statusConfig[project.status].label}</span>
                  <span className="text-xs text-blue-600 font-medium ml-auto">Current Stage</span>
                </div>
                
                {isEditingCurrentStage ? (
                  <div className="space-y-2">
                    <textarea
                      value={currentStageNotes}
                      onChange={(e) => setCurrentStageNotes(e.target.value)}
                      placeholder={`Add notes for ${statusConfig[project.status].label}...`}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-white"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {currentStageNotes.length} characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCurrentStageNotes}
                        disabled={isSavingStage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <Save size={16} />
                        {isSavingStage ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelCurrentStageEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentStageNotes ? (
                      <>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-100 p-3 rounded-lg border border-gray-300">
                          {currentStageNotes}
                        </p>
                        {project.currentStageNotesBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            by {project.currentStageNotesBy} {project.currentStageNotesDate && `• ${formatDate(project.currentStageNotesDate)}`}
                          </p>
                        )}
                        <div className="mt-3">
                          <button
                            onClick={handleSendSlackStage}
                            disabled={sendingSlackStage}
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
                              {sendingSlackStage ? 'Sending...' : 'Send to Slack'}
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg border border-gray-300">
                        No notes for this stage yet. Click &quot;Edit&quot; to add notes.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Project Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">General Project Notes</h3>
              {!isEditingGeneral && (
                <button
                  onClick={() => setIsEditingGeneral(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              These notes apply to the entire project and are not tied to a specific stage.
            </p>
            
            {isEditingGeneral ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add general notes about this project..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {notes.length} characters
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGeneralNotes}
                    disabled={isSavingGeneral}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSavingGeneral ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelGeneralEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {notes ? (
                  <>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-100 p-4 rounded-lg border border-gray-300">
                      {notes}
                    </p>
                    {project.notesBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        by {project.notesBy} {project.notesDate && `• ${formatDate(project.notesDate)}`}
                      </p>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={handleSendSlackGeneral}
                        disabled={sendingSlackGeneral}
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
                          {sendingSlackGeneral ? 'Sending...' : 'Send to Slack'}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-100 p-4 rounded-lg border border-gray-300">
                    No general notes yet. Click &quot;Edit&quot; to add notes.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}