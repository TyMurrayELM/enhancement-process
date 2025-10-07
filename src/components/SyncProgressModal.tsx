'use client';

import { Loader2, CheckCircle, XCircle, Circle } from 'lucide-react';

interface SyncProgressModalProps {
  isOpen: boolean;
  status: 'syncing' | 'success' | 'error';
  message?: string;
  syncedCount?: number;
  currentStage?: number; // 0 = fetching opportunities, 1 = fetching property data, 2 = updating database
}

export default function SyncProgressModal({ 
  isOpen, 
  status, 
  message,
  syncedCount,
  currentStage = 0
}: SyncProgressModalProps) {
  if (!isOpen) return null;

  const stages = [
    'Fetching opportunities from Aspire',
    'Fetching property data',
    'Updating database'
  ];

  const getStageIcon = (stageIndex: number) => {
    if (status !== 'syncing') {
      // All stages complete
      return <CheckCircle className="text-green-600" size={20} />;
    }
    
    if (stageIndex < currentStage) {
      // Completed stage
      return <CheckCircle className="text-green-600" size={20} />;
    } else if (stageIndex === currentStage) {
      // Current stage
      return <Loader2 className="text-blue-600 animate-spin" size={20} />;
    } else {
      // Upcoming stage
      return <Circle className="text-gray-300" size={20} />;
    }
  };

  const getStageTextColor = (stageIndex: number) => {
    if (status !== 'syncing') {
      return 'text-green-700 font-medium';
    }
    
    if (stageIndex < currentStage) {
      return 'text-green-700';
    } else if (stageIndex === currentStage) {
      return 'text-blue-700 font-semibold';
    } else {
      return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-300">
        <div className="p-6">
          {status === 'syncing' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="text-blue-600 animate-spin" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Syncing from Aspire...
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Please wait while we fetch the latest opportunities.
              </p>
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index === currentStage 
                        ? 'bg-blue-50 border border-blue-200' 
                        : index < currentStage
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getStageIcon(index)}
                    </div>
                    <span className={`text-sm ${getStageTextColor(index)}`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="text-green-600" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sync Complete!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {message || `Successfully synced ${syncedCount || 0} opportunities`}
              </p>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200"
                  >
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-xs text-green-700">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="text-red-600" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sync Failed
              </h3>
              <p className="text-sm text-gray-600">
                {message || 'An error occurred while syncing'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}