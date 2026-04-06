// =============================================================================
// REALTIME INDICATOR COMPONENT
// =============================================================================
// Muestra el estado de conexión en tiempo real y usuarios online

import React from 'react';
import { Wifi, WifiOff, Users, Activity } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  onlineCount?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  onlineCount,
  label = 'En vivo',
  size = 'sm',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
      isConnected
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}>
      {isConnected ? (
        <>
          <span className={`${dotSize[size]} rounded-full bg-green-500 animate-pulse`} />
          <Wifi size={iconSize[size]} />
          <span>{label}</span>
          {onlineCount !== undefined && onlineCount > 0 && (
            <span className="flex items-center gap-0.5 ml-1">
              <Users size={iconSize[size] - 2} />
              {onlineCount}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff size={iconSize[size]} />
          <span>Desconectado</span>
        </>
      )}
    </div>
  );
};

// =============================================================================
// LIVE DOT COMPONENT
// =============================================================================
// Un simple punto verde pulsante para indicar datos en vivo

export const LiveDot: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    <span className="text-xs text-green-700 font-medium">En vivo</span>
  </span>
);

// =============================================================================
// ACTIVITY FEED COMPONENT
// =============================================================================
// Muestra actividad reciente en tiempo real

interface ActivityEvent {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  maxItems = 10,
  className = '',
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'insert': return '📩';
      case 'update': return '🔄';
      case 'delete': return '🗑️';
      default: return '📋';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-700">Actividad Reciente</h3>
        <LiveDot />
      </div>
      {events.slice(0, maxItems).map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <span className="text-lg">{getIcon(event.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">{event.description}</p>
            <p className="text-xs text-gray-500">
              {event.table} • {formatTime(event.timestamp)}
            </p>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          Sin actividad reciente
        </p>
      )}
    </div>
  );
};
