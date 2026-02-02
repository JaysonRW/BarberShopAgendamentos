import * as React from 'react';

export const LoadingSpinner: React.FC<{ message?: string, progress?: number }> = ({ message = 'Carregando...', progress }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-red-600"></div>
      <p className="text-white mt-4">{message}</p>
      {progress !== undefined && (
        <div className="w-48 bg-gray-600 rounded-full h-2.5 mt-4">
          <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  </div>
);
