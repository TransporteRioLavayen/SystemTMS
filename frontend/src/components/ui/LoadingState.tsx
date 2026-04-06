import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando datos...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-500 min-h-[200px]">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-indigo-600 mb-4" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
