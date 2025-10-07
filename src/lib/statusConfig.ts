import { Calendar, CheckCircle, Clock, AlertCircle, DollarSign, Archive } from 'lucide-react';

export const statusConfig = {
  proposal_verification: { 
    label: "Proposal Verification", 
    color: "bg-blue-100 text-blue-800", 
    icon: DollarSign, 
    nextStatus: "won_planning" as const
  },
  won_planning: { 
    label: "Won - Planning", 
    color: "bg-purple-100 text-purple-800", 
    icon: Calendar, 
    nextStatus: "in_progress" as const
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: Clock, 
    nextStatus: "complete" as const
  },
  complete: { 
    label: "Complete", 
    color: "bg-green-100 text-green-800", 
    icon: CheckCircle, 
    nextStatus: "follow_up" as const
  },
  follow_up: { 
    label: "Warranty Period", 
    color: "bg-orange-100 text-orange-800", 
    icon: AlertCircle, 
    nextStatus: "fully_complete" as const
  },
  fully_complete: { 
    label: "Fully Complete", 
    color: "bg-green-100 text-green-800", 
    icon: Archive, 
    nextStatus: null
  }
};