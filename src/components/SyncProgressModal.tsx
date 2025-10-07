'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SyncProgressModalProps {
  isOpen: boolean;
  status: 'syncing' | 'success' | 'error';
  message?: string;
  syncedCount?: number;
}

export default function SyncProgressModal({ 
  isOpen, 
  status, 
  message,
  syncedCount 
}: SyncProgressModalProps) {
  if (!isOpen) return null;

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
              <p className="text-sm text-gray-600">
                Please wait while we fetch the latest opportunities.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Fetching opportunities from Aspire
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                  Fetching property data
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                  Updating database
                </div>
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
              <p className="text-sm text-gray-600">
                {message || `Successfully synced ${syncedCount || 0} opportunities`}
              </p>
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