import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
      <AlertCircle className="w-12 h-12 mb-3 opacity-80" />
      <h3 className="text-lg font-medium text-red-800 mb-1">Ha ocurrido un error</h3>
      <p className="text-sm text-red-600 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors font-medium text-sm border border-red-200"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
