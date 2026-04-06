// =============================================================================
// SSE NOTIFICATIONS HOOK - FRONTEND
// =============================================================================
// Conecta los eventos SSE del backend con el sistema de notificaciones global.
// Cada evento de cambio en la base de datos se convierte en una notificación
// que aparece en la campanita del header.
//
// Uso:
//   useSSENotifications(); // Se conecta automáticamente al SSE y traduce eventos

import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

// Mapa de traducción: tabla + acción → notificación
const EVENT_CONFIG: Record<string, {
  title: string;
  message: (payload: any) => string;
  type: 'info' | 'success' | 'warning' | 'error';
}> = {
  // Planillas
  'planillas:INSERT': {
    title: 'Nueva Planilla',
    message: (p) => `Planilla ${p?.id || 'creada'} registrada`,
    type: 'info',
  },
  'planillas:UPDATE': {
    title: 'Planilla Actualizada',
    message: (p) => `Planilla ${p?.id || ''} cambió a estado "${p?.estado || 'desconocido'}"`,
    type: 'info',
  },
  'remitos:INSERT': {
    title: 'Nuevo Remito',
    message: (p) => `Remito ${p?.numero_remito || p?.id || 'agregado'} a la planilla`,
    type: 'info',
  },
  // Hojas de Ruta
  'hojas_ruta:INSERT': {
    title: 'Nueva Hoja de Ruta',
    message: (p) => `Hoja ${p?.id || 'creada'} asignada a ${p?.chofer || 'unidad'}`,
    type: 'success',
  },
  'hojas_ruta:UPDATE': {
    title: 'Hoja de Ruta Actualizada',
    message: (p) => `Hoja ${p?.id || ''} → estado "${p?.estado || 'desconocido'}"`,
    type: 'info',
  },
  // Flota
  'choferes:INSERT': {
    title: 'Nuevo Chofer',
    message: (p) => `Chofer ${p?.nombre || 'registrado'} dado de alta`,
    type: 'info',
  },
  'choferes:UPDATE': {
    title: 'Chofer Actualizado',
    message: (p) => `Chofer ${p?.nombre || ''} → ${p?.estado || ''}`,
    type: 'info',
  },
  'unidades:INSERT': {
    title: 'Nueva Unidad',
    message: (p) => `Unidad ${p?.patente || p?.id || 'registrada'} dada de alta`,
    type: 'info',
  },
  'unidades:UPDATE': {
    title: 'Unidad Actualizada',
    message: (p) => `Unidad ${p?.patente || ''} → ${p?.estado || ''}`,
    type: 'info',
  },
  'depositos:INSERT': {
    title: 'Nuevo Depósito',
    message: (p) => `Depósito ${p?.nombre || 'registrado'} dado de alta`,
    type: 'info',
  },
  'depositos:UPDATE': {
    title: 'Depósito Actualizado',
    message: (p) => `Depósito ${p?.nombre || ''} → ${p?.estado || ''}`,
    type: 'info',
  },
  'terceros:INSERT': {
    title: 'Nuevo Tercero',
    message: (p) => `Tercero ${p?.nombre || 'registrado'} dado de alta`,
    type: 'info',
  },
  'terceros:UPDATE': {
    title: 'Tercero Actualizado',
    message: (p) => `Tercero ${p?.nombre || ''} → ${p?.estado || ''}`,
    type: 'info',
  },
  'hoja_ruta_remitos:INSERT': {
    title: 'Carga Asignada',
    message: (p) => `Nueva carga asignada a hoja de ruta`,
    type: 'success',
  },
};

// Eventos especiales que merecen warning/error
const WARNING_EVENTS = new Set([
  'hojas_ruta:UPDATE', // Podría ser un rechazo
]);

export function useSSENotifications() {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const addNotificationRef = useRef(addNotification);

  // Mantener referencia actualizada sin re-crear el hook
  addNotificationRef.current = addNotification;

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const params = new URLSearchParams();
    if (user?.id) params.set('userId', user.id);
    if (user?.name) params.set('userName', user.name);

    const url = `${API_URL}/events?${params.toString()}`;

    let es: EventSource | null = new EventSource(url);
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    es.addEventListener('realtime', (e) => {
      try {
        const event = JSON.parse(e.data);
        const key = `${event.table}:${event.action}`;
        const config = EVENT_CONFIG[key];

        if (config) {
          const payload = event.payload?.new || event.payload;
          
          // Determinar tipo de notificación
          let notifType = config.type;
          if (payload?.estado === 'Rechazado' || payload?.estado === 'incompleto') {
            notifType = 'warning';
          } else if (payload?.estado === 'completo' || payload?.estado === 'Entregado') {
            notifType = 'success';
          }

          addNotificationRef.current({
            type: notifType,
            title: config.title,
            message: config.message(payload),
          });
        }
      } catch (err) {
        console.error('[SSE Notifications] Error procesando evento:', err);
      }
    });

    es.onerror = () => {
      if (es) {
        es.close();
        es = null;
      }
      reconnectTimeout = setTimeout(() => {
        es = new EventSource(url);
        es.addEventListener('realtime', (e) => {
          try {
            const event = JSON.parse(e.data);
            const key = `${event.table}:${event.action}`;
            const config = EVENT_CONFIG[key];
            if (config) {
              const payload = event.payload?.new || event.payload;
              let notifType = config.type;
              if (payload?.estado === 'Rechazado' || payload?.estado === 'incompleto') {
                notifType = 'warning';
              } else if (payload?.estado === 'completo' || payload?.estado === 'Entregado') {
                notifType = 'success';
              }
              addNotificationRef.current({
                type: notifType,
                title: config.title,
                message: config.message(payload),
              });
            }
          } catch (err) {
            console.error('[SSE Notifications] Error procesando evento:', err);
          }
        });
      }, 5000);
    };

    return () => {
      if (es) {
        es.close();
        es = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };
  }, [user?.id, user?.name]);
}
