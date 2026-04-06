// =============================================================================
// NOTIFICATION CENTER - FRONTEND
// =============================================================================
// Componente de campanita con dropdown de notificaciones en tiempo real

import React, { useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNotifications, Notification } from '../../application/context/NotificationsContext';

interface NotificationCenterProps {
  notifications: ReturnType<typeof useNotifications>;
}

const typeConfig: Record<Notification['type'], { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  info: {
    icon: <Info size={16} />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  success: {
    icon: <CheckCircle size={16} />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  error: {
    icon: <AlertCircle size={16} />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export default function NotificationCenter({ notifications }: NotificationCenterProps) {
  const {
    notifications: notifs,
    unreadCount,
    isOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleOpen,
  } = notifications;

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // No cerramos automáticamente para mejor UX
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón campanita */}
      <button
        onClick={toggleOpen}
        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Marcar todas como leídas"
                >
                  <Check size={14} />
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Limpiar todo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay notificaciones</p>
                <p className="text-xs text-gray-400 mt-1">Los eventos del sistema aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map(notif => {
                  const config = typeConfig[notif.type];
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.text} border ${config.border}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm font-medium truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-1 mt-1 text-gray-400">
                            <Clock size={10} />
                            <span className="text-[10px]">{formatTime(notif.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
