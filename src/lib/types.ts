export type ProjectStatus = 
  | 'proposal_verification'
  | 'won_planning'
  | 'in_progress'
  | 'complete'
  | 'follow_up'
  | 'fully_complete';

export type MaterialsStatus = 
  | 'need_to_order'
  | 'in_route'
  | 'received'
  | 'not_needed';

export interface Project {
  id: number;
  aspireWoNumber?: string;
  opportunityId?: number;
  clientName: string;
  oppName?: string;
  status: ProjectStatus;
  materialsStatus: MaterialsStatus;
  value: number;
  accountManager: string;
  specialist: string;
  branchName?: string;
  regionName?: string;
  actualLaborHours?: number;
  estimatedLaborHours?: number;
  actualGrossMarginPercent?: number | null;
  estimatedGrossMarginPercent?: number | null;
  estimatedMaterialCost?: number | null;
  actualCostMaterial?: number | null;
  estimatorNotes?: string | null;
  createdDate: string;
  scheduledDate: string | null;
  completedDate?: string;
  wonDate?: string | null;
  initialMeetingScheduledDate?: string | null;
  notes?: string;
  notesBy?: string;
  notesDate?: string;
  currentStageNotes?: string;
  currentStageNotesBy?: string;
  currentStageNotesDate?: string;
  requiresIrrigation: boolean;
  requiresSpray: boolean;
  beforePhotos?: number;
  progressPhotos?: number;
  completedPhotos?: number;
  checklistProgress: {
    completed: number;
    total: number;
  };
  beforePhotoLink?: string;
  beforePhotoDate?: string;
  progressPhotoLinks?: Array<{ link: string; addedDate: string }>;
  completionPhotoLink?: string;
  completionPhotoDate?: string;
  materialsVendors?: string;
  fieldSupervisor?: string;
  checklistData?: Record<string, { 
    completed: boolean; 
    completedDate: string | null;
    completedBy?: string;
  }>;
  stageHistory?: Array<{
    stage: ProjectStatus;
    completedDate: string;
    notes?: string;
    notesBy?: string;
    notesDate?: string;
    checklistData: Record<string, { 
      completed: boolean; 
      completedDate: string | null;
      completedBy?: string;
    }>;
  }>;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

// Helper function to generate Aspire link
export function getAspireLink(opportunityId?: number): string | null {
  if (!opportunityId) return null;
  return `https://cloud.youraspire.com/app/opportunities/details/${opportunityId}`;
}