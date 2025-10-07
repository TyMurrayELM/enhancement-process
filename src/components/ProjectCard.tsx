import { Project } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';
import { Calendar, Image, CheckCircle } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
}

export default function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;
  const progress = project.checklistProgress;
  const isComplete = progress.completed === progress.total;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all hover:border-blue-300">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 flex-1 truncate">{project.clientName}</h3>
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ml-2 ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      {/* All info in one line */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-gray-600 flex-1 truncate">
          <span className="text-gray-500">WO:</span> <span className="font-medium text-gray-700">{project.aspireWoNumber || `#${project.id}`}</span>
          <span className="mx-1.5 text-gray-300">•</span>
          <span className="font-semibold text-blue-600">${project.value.toLocaleString()}</span>
          <span className="mx-1.5 text-gray-300">•</span>
          <span className="text-gray-500">AM:</span> <span className="text-gray-700">{project.accountManager}</span>
          <span className="mx-1.5 text-gray-300">•</span>
          <span className="text-gray-500">Spec:</span> <span className="text-gray-700">{project.specialist}</span>
          <span className="mx-1.5 text-gray-300">•</span>
          {project.scheduledDate ? (
            <span className="text-gray-700">{new Date(project.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          ) : (
            <span className="text-gray-400">Not scheduled</span>
          )}
        </div>

        <div className="flex gap-1.5 ml-2">
          {project.requiresIrrigation && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">Irr</span>
          )}
          {project.requiresSpray && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">Spray</span>
          )}
          {project.status === 'in_progress' && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1 font-medium">
              <Image size={12} />
              {(project.beforePhotos || 0) + (project.progressPhotos || 0)}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={`font-medium ${isComplete ? 'text-blue-600' : 'text-gray-600'}`}>
            Stage Progress: {progress.completed}/{progress.total}
          </span>
          {isComplete && (
            <span className="text-blue-600 flex items-center gap-1 font-medium">
              <CheckCircle size={14} />
              Ready
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${isComplete ? 'bg-blue-600' : 'bg-blue-500'}`}
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onViewDetails(project)}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
      >
        View Checklist
      </button>
    </div>
  );
}