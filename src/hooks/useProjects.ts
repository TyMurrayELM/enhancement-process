'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, ProjectStatus, MaterialsStatus } from '@/lib/types';
import { getStageRequirements } from '@/utils/requirements';

interface DatabaseProject {
  id: number;
  aspire_wo_number?: string;
  opportunity_id?: number;
  property?: string;
  opp_name?: string;
  stage: string;
  materials_status?: string;
  value?: number;
  client_specialist?: string;
  enh_specialist?: string;
  branch_name?: string;
  region_name?: string;
  actual_labor_hours?: number;
  estimated_labor_hours?: number;
  actual_gross_margin_percent?: number;
  estimated_gross_margin_percent?: number;
  estimated_material_cost?: number;
  actual_cost_material?: number;
  estimator_notes?: string;
  created_date: string;
  scheduled_date?: string;
  completed_date?: string;
  won_date?: string;
  initial_meeting_scheduled_date?: string;
  notes?: string;
  notes_by?: string;
  notes_date?: string;
  current_stage_notes?: string;
  current_stage_notes_by?: string;
  current_stage_notes_date?: string;
  requires_irrigation?: boolean;
  requires_spray?: boolean;
  before_photos?: number;
  progress_photos?: number;
  completed_photos?: number;
  before_photo_link?: string;
  before_photo_date?: string;
  progress_photo_links?: Array<{ link: string; addedDate: string }>;
  completion_photo_link?: string;
  completion_photo_date?: string;
  materials_vendors?: string;
  field_supervisor?: string;
  checklist_data?: Record<string, { 
    completed: boolean; 
    completedDate: string | null;
    completedBy?: string;
  }>;
  stage_history?: Array<{
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

// Helper function to calculate checklist progress
function calculateChecklistProgress(project: DatabaseProject): { completed: number; total: number } {
  // Create a minimal project object with just what getStageRequirements needs
  const minimalProject = {
    status: project.stage as ProjectStatus,
    value: project.value || 0,
    requiresIrrigation: project.requires_irrigation || false,
    requiresSpray: project.requires_spray || false,
  } as Project;
  
  const requirements = getStageRequirements(project.stage, minimalProject);
  
  const total = requirements.length;
  let completed = 0;
  
  const checklistData = project.checklist_data || {};
  
  requirements.forEach(item => {
    // Special handling for photo items
    if (item.id === 'beforePhotos' && project.before_photo_link) {
      completed++;
    } else if (item.id === 'progressPhotos' && project.progress_photo_links?.length) {
      completed++;
    } else if (item.id === 'completionPhotos' && project.completion_photo_link) {
      completed++;
    } else if (checklistData[item.id]?.completed) {
      completed++;
    }
  });
  
  return { completed, total };
}

// Helper function to map database row to Project interface
function mapDatabaseToProject(row: DatabaseProject): Project {
  const checklistProgress = calculateChecklistProgress(row);
  
  return {
    id: row.id,
    aspireWoNumber: row.aspire_wo_number,
    opportunityId: row.opportunity_id,
    clientName: row.property || 'Unknown Property',
    oppName: row.opp_name,
    status: row.stage as ProjectStatus,
    materialsStatus: (row.materials_status as MaterialsStatus) || 'need_to_order',
    value: row.value || 0,
    accountManager: row.client_specialist || 'Unknown',
    specialist: row.enh_specialist || 'Unknown',
    branchName: row.branch_name,
    regionName: row.region_name,
    actualLaborHours: row.actual_labor_hours,
    estimatedLaborHours: row.estimated_labor_hours,
    actualGrossMarginPercent: row.actual_gross_margin_percent,
    estimatedGrossMarginPercent: row.estimated_gross_margin_percent,
    estimatedMaterialCost: row.estimated_material_cost,
    actualCostMaterial: row.actual_cost_material,
    estimatorNotes: row.estimator_notes,
    createdDate: row.created_date,
    scheduledDate: row.scheduled_date || null,
    completedDate: row.completed_date,
    wonDate: row.won_date,
    initialMeetingScheduledDate: row.initial_meeting_scheduled_date,
    notes: row.notes,
    notesBy: row.notes_by,
    notesDate: row.notes_date,
    currentStageNotes: row.current_stage_notes,
    currentStageNotesBy: row.current_stage_notes_by,
    currentStageNotesDate: row.current_stage_notes_date,
    requiresIrrigation: row.requires_irrigation || false,
    requiresSpray: row.requires_spray || false,
    beforePhotos: row.before_photos,
    progressPhotos: row.progress_photos,
    completedPhotos: row.completed_photos,
    checklistProgress,
    beforePhotoLink: row.before_photo_link,
    beforePhotoDate: row.before_photo_date,
    progressPhotoLinks: row.progress_photo_links,
    completionPhotoLink: row.completion_photo_link,
    completionPhotoDate: row.completion_photo_date,
    materialsVendors: row.materials_vendors,
    fieldSupervisor: row.field_supervisor,
    checklistData: row.checklist_data,
    stageHistory: row.stage_history,
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .neq('stage', 'proposal')
        .order('aspire_wo_number', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        setError(fetchError.message);
        setProjects([]);
      } else {
        const mappedProjects = (data || []).map(mapDatabaseToProject);
        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error('Unexpected error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  async function updateProject(updatedProject: Project) {
    try {
      console.log('Updating project:', updatedProject.id);
      console.log('Updated project data:', updatedProject);
      
      // Map camelCase back to snake_case for database
      const updateData = {
        stage: updatedProject.status,
        materials_status: updatedProject.materialsStatus,
        value: updatedProject.value,
        scheduled_date: updatedProject.scheduledDate,
        completed_date: updatedProject.completedDate,
        won_date: updatedProject.wonDate,
        initial_meeting_scheduled_date: updatedProject.initialMeetingScheduledDate || null,
        notes: updatedProject.notes || null,
        notes_by: updatedProject.notesBy || null,
        notes_date: updatedProject.notesDate || null,
        current_stage_notes: updatedProject.currentStageNotes || null,
        current_stage_notes_by: updatedProject.currentStageNotesBy || null,
        current_stage_notes_date: updatedProject.currentStageNotesDate || null,
        actual_labor_hours: updatedProject.actualLaborHours || null,
        estimated_labor_hours: updatedProject.estimatedLaborHours || null,
        actual_gross_margin_percent: updatedProject.actualGrossMarginPercent || null,
        estimated_gross_margin_percent: updatedProject.estimatedGrossMarginPercent || null,
        estimated_material_cost: updatedProject.estimatedMaterialCost || null,
        actual_cost_material: updatedProject.actualCostMaterial || null,
        estimator_notes: updatedProject.estimatorNotes || null,
        requires_irrigation: updatedProject.requiresIrrigation,
        requires_spray: updatedProject.requiresSpray,
        before_photo_link: updatedProject.beforePhotoLink || null,
        before_photo_date: updatedProject.beforePhotoDate || null,
        progress_photo_links: updatedProject.progressPhotoLinks || null,
        completion_photo_link: updatedProject.completionPhotoLink || null,
        completion_photo_date: updatedProject.completionPhotoDate || null,
        materials_vendors: updatedProject.materialsVendors || null,
        field_supervisor: updatedProject.fieldSupervisor || null,
        checklist_data: updatedProject.checklistData || null,
        stage_history: updatedProject.stageHistory || null,
        updated_at: new Date().toISOString(),
      };

      console.log('Sending update data to Supabase:', updateData);

      const { data, error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', updatedProject.id)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        console.error('Error details:', JSON.stringify(updateError, null, 2));
        throw new Error(updateError.message || 'Failed to update project');
      }

      console.log('Update successful:', data);

      // Update local state
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      
      // Optionally refetch to ensure sync
      await fetchProjects();
      
    } catch (err) {
      console.error('Failed to update project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to update project: ${errorMessage}`);
      throw err;
    }
  }

  return { 
    projects, 
    loading, 
    error,
    updateProject, 
    refetch: fetchProjects 
  };
}