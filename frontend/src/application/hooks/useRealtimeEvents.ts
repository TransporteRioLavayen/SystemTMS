// =============================================================================
// USE REALTIME EVENTS HOOK - FRONTEND
// =============================================================================
// Hook que se conecta al endpoint SSE del backend (/api/events)
// y recibe eventos en tiempo real cuando cambian datos en la DB.
//
// El backend se suscribe a Supabase Realtime y re-emite via SSE.
// El frontend solo necesita usar EventSource nativo.
//
// Uso:
//   useRealtimeEvents({
//     onEvent: (event) => { ... },
//     onPlanillaChange: (event) => { ... },
//     onHojaChange: (event) => { ... },
//     onFlotaChange: (event) => { ... },
//     onPresence: (data) => { ... },
//   });

import { useEffect, useRef, useCallback } from 'react';

interface RealtimeEvent {
  id: string;
  type: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
}

interface UseRealtimeEventsOptions {
  enabled?: boolean;
  userId?: string;
  userName?: string;
  tables?: string[];
  actions?: string[];
  /** Función para obtener el token de sesión de Clerk */
  getSessionToken?: () => Promise<string | null>;
  onEvent?: (event: RealtimeEvent) => void;
  onPlanillaChange?: (event: RealtimeEvent) => void;
  onHojaChange?: (event: RealtimeEvent) => void;
  onFlotaChange?: (event: RealtimeEvent) => void;
  onPresence?: (data: { users: Array<{ id: string; name: string }>; count: number }) => void;
  onConnected?: (data: any) => void;
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const {
    enabled = true,
    userId,
    userName,
    tables,
    actions,
    getSessionToken,
    onEvent,
    onPlanillaChange,
    onHojaChange,
    onFlotaChange,
    onPresence,
    onConnected,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);

  // Mantener options actualizados sin re-crear el EventSource
  optionsRef.current = options;

  const connect = useCallback(async () => {
    if (!enabled) return;

    // Cerrar conexión existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userName) params.set('userName', userName);
    if (tables) params.set('tables', tables.join(','));
    if (actions) params.set('actions', actions.join(','));

    // Inyectar Clerk session token para autenticación SSE
    // EventSource no soporta headers, así que pasamos el token como query param
    if (getSessionToken) {
      try {
        const token = await getSessionToken();
        if (token) {
          params.set('token', token);
        }
      } catch {
        // Si no hay sesión, el backend rechazará la conexión SSE
      }
    }

    const url = `${API_URL}/events?${params.toString()}`;
    console.log(`📡 [Realtime] Conectando a SSE: ${url}`);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', (e) => {
      console.log('✅ [Realtime] Conectado al stream de eventos');
      optionsRef.current.onConnected?.(JSON.parse(e.data));
    });

    es.addEventListener('realtime', (e) => {
      const event: RealtimeEvent = JSON.parse(e.data);
      const opts = optionsRef.current;

      opts.onEvent?.(event);

      // Dispatch por tabla
      switch (event.table) {
        case 'planillas':
        case 'remitos':
          opts.onPlanillaChange?.(event);
          break;
        case 'hojas_ruta':
        case 'hoja_ruta_remitos':
          opts.onHojaChange?.(event);
          break;
        case 'choferes':
        case 'unidades':
        case 'depositos':
        case 'terceros':
          opts.onFlotaChange?.(event);
          break;
      }
    });

    es.addEventListener('presence', (e) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onPresence?.(data);
    });

    es.addEventListener('ping', () => {
      // Heartbeat - mantener conexión viva
    });

    es.onerror = (err) => {
      console.warn('⚠️ [Realtime] Error de conexión SSE, reconectando en 5s...');
      es.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [enabled, userId, userName, tables?.join(','), actions?.join(',')]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log('🔌 [Realtime] Desconectado del stream de eventos');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
