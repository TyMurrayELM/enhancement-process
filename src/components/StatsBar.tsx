import { Project } from '@/lib/types';
import { statusConfig } from '@/lib/statusConfig';

interface StatsBarProps {
  projects: Project[];
}

export default function StatsBar({ projects }: StatsBarProps) {
  const stats = {
    total: projects.length,
    proposalVerification: projects.filter(p => p.status === 'proposal_verification').length,
    proposalVerificationValue: projects.filter(p => p.status === 'proposal_verification').reduce((sum, p) => sum + p.value, 0),
    planning: projects.filter(p => p.status === 'won_planning').length,
    planningValue: projects.filter(p => p.status === 'won_planning').reduce((sum, p) => sum + p.value, 0),
    active: projects.filter(p => p.status === 'in_progress').length,
    activeValue: projects.filter(p => p.status === 'in_progress').reduce((sum, p) => sum + p.value, 0),
    complete: projects.filter(p => p.status === 'complete').length,
    completeValue: projects.filter(p => p.status === 'complete').reduce((sum, p) => sum + p.value, 0),
    followUp: projects.filter(p => p.status === 'follow_up').length,
    followUpValue: projects.filter(p => p.status === 'follow_up').reduce((sum, p) => sum + p.value, 0),
    fullyComplete: projects.filter(p => p.status === 'fully_complete').length,
    fullyCompleteValue: projects.filter(p => p.status === 'fully_complete').reduce((sum, p) => sum + p.value, 0),
    backlogValue: projects
      .filter(p => p.status !== 'fully_complete')
      .reduce((sum, p) => sum + p.value, 0)
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm border-2 border-blue-300 p-4 hover:shadow-md transition-shadow">
        <p className="text-xs font-medium text-gray-600 mb-1">Backlog Value</p>
        <p className="text-2xl font-bold text-blue-700">${(stats.backlogValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-blue-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.proposal_verification.label}</p>
        <p className="text-2xl font-bold text-blue-600">{stats.proposalVerification}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.proposalVerificationValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-blue-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.won_planning.label}</p>
        <p className="text-2xl font-bold text-purple-600">{stats.planning}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.planningValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-blue-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.in_progress.label}</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.activeValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-blue-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.complete.label}</p>
        <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.completeValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-orange-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.follow_up.label}</p>
        <p className="text-2xl font-bold text-orange-600">{stats.followUp}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.followUpValue / 1000).toFixed(1)}k</p>
      </div>
      <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4 hover:shadow-md transition-shadow border-t-4 border-t-green-400">
        <p className="text-xs font-medium text-gray-500 mb-1">{statusConfig.fully_complete.label}</p>
        <p className="text-2xl font-bold text-green-600">{stats.fullyComplete}</p>
        <p className="text-xs text-gray-500 mt-1">${(stats.fullyCompleteValue / 1000).toFixed(1)}k</p>
      </div>
    </div>
  );
}