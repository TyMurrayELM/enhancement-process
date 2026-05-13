import type { Session } from 'next-auth';
import { Project, getAspireLink } from '@/lib/types';
import { getBranchEmoji } from '@/lib/branchConfig';

export interface SlackNotePayload {
  project: Project;
  event: 'stage_note_added' | 'general_note_added';
  stage: string;
  stageName: string;
  note: string;
  fieldSupervisorOverride?: string | null;
  session: Session | null;
}

export async function sendSlackNote(payload: SlackNotePayload): Promise<void> {
  const { project, event, stage, stageName, note, fieldSupervisorOverride, session } = payload;

  const body = {
    event,
    stage,
    stageName,
    note,
    projectNumber: project.aspireWoNumber || `ID-${project.id}`,
    opportunityId: project.opportunityId,
    aspireLink: getAspireLink(project.opportunityId),
    propertyName: project.clientName,
    oppName: project.oppName,
    accountManager: project.accountManager,
    specialist: project.specialist,
    fieldSupervisor: fieldSupervisorOverride ?? project.fieldSupervisor ?? null,
    value: project.value,
    branchName: project.branchName,
    branchEmoji: getBranchEmoji(project.branchName),
    regionName: project.regionName,
    sentBy: session?.user?.name || session?.user?.email || 'Unknown User',
    sentByEmail: session?.user?.email || null,
    sentAt: new Date().toISOString(),
    projectUrl: typeof window !== 'undefined' ? window.location.origin : '',
  };

  const response = await fetch('/api/zapier-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }
}
