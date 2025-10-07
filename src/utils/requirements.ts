import { Project, ChecklistItem } from '@/lib/types';

export const getStageRequirements = (status: string, project: Project): ChecklistItem[] => {
  switch(status) {
    case 'proposal':
      return [];
    case 'proposal_verification':
      return [
        { id: 'deliveryCharges', label: 'All delivery, dumps, fuel charges included in bid', required: true },
        { id: 'maps', label: 'Maps, renderings, special notes in Estimator Notes', required: true },
        { id: 'executiveApproval', label: 'Executive team approval obtained', required: project.value > 10000 },
        { id: 'sentToClient', label: 'Proposal provided to Client via Client Specialist or in co-ordination with Client Specialist', required: true },
        { id: 'schedinitial', label: 'Scheduled initial meeting on-site',  required: project.value > 2500 },
      ].filter(item => item.required);
    case 'won_planning':
      return [
        { id: 'schedInitialMeeting', label: 'Initial meeting on-site, scheduled', required: true },
        { id: 'meeting', label: 'Initial meeting held on-site', required: true },
        { id: 'valves', label: 'Valves and timer stations located', required: project.requiresIrrigation },
        { id: 'materials', label: 'Materials secured and delivered', required: true },
        { id: 'quotes', label: 'Multiple vendor quotes obtained', required: project.value > 2500 },
        { id: 'scheduled', label: 'Job scheduled in Aspire', required: true },
        { id: 'fsassigned', label: 'Field Supervisor assigned to work order', required: true },
        { id: 'clientNotified', label: 'Specialist notifies Client Specialist and Client of Schedule Date', required: true }
      ].filter(item => item.required);
    case 'in_progress':
      return [
        { id: 'beforePhotos', label: 'Before pictures taken', required: true },
        { id: 'progressPhotos', label: 'Progress pictures taken', required: true },
        { id: 'completionPhotos', label: 'Completion pictures taken', required: true }
      ];
    case 'complete':
      return [
        { id: 'treesCondition', label: 'Trees & shrubs in good condition', required: true },
        { id: 'staked', label: 'Trees double-staked, wired, nursery stakes removed', required: true },
        { id: 'irrigation', label: 'Irrigation working, timers set, drip lines installed', required: true },
        { id: 'riprap', label: 'Riprap and granite evenly installed', required: true },
        { id: 'washed', label: 'Parking lots, sidewalks washed', required: true },
        { id: 'photos', label: 'Before/During/Completed photos sent to Client Specialist', required: true },
        { id: 'aspireReview', label: 'Hours and materials reviewed in Aspire', required: true },
        { id: 'gmReview', label: 'GM% reviewed with Enhancement Manager', required: project.value > 2500 }
      ];
    case 'follow_up':
      return [
        { id: 'weekOneInspection', label: '1-week inspection completed by Field Supervisor', required: true },
        { id: 'issuesIdentified', label: 'Any issues identified and reported to Enhancements Manager', required: true },
        { id: 'clientNotifiedIssues', label: 'Enhancements Specialist and Client Specialist to notify client of any issues (if applicable)', required: true },
        { id: 'month1Visit', label: 'Month 1 follow-up visit completed', required: true },
        { id: 'month2Visit', label: 'Month 2 follow-up visit completed', required: true },
        { id: 'month3Visit', label: 'Month 3 follow-up visit completed (90-day monitoring complete)', required: true }
      ];
    case 'fully_complete':
      return [];
    default:
      return [];
  }
};