// =============================================================================
// REALTIME CONTEXT - FRONTEND
// =============================================================================
// Contexto singleton para manejar UNA SOLA conexión SSE con el backend.
// Los demás contextos (Planillas, Flota, etc.) se suscriben a este provider.

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { useAuth } from './AuthContext';
import { useClerk } from '@clerk/clerk-react';

interface RealtimeEvent {
  id: string;
  type: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
}

interface RealtimeContextType {
  // Suscripciones dinámicas si fueran necesarias
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
  onPlanillaChange?: (event: RealtimeEvent) => void;
  onHojaChange?: (event: RealtimeEvent) => void;
  onFlotaChange?: (event: RealtimeEvent) => void;
}

// Lista global de suscriptores para evitar dependencias circulares de hooks
const subscribers = {
  planillas: new Set<(event: RealtimeEvent) => void>(),
  hojas: new Set<(event: RealtimeEvent) => void>(),
  flota: new Set<(event: RealtimeEvent) => void>(),
  events: new Set<(event: RealtimeEvent) => void>(),
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { session } = useClerk();

  // Función para obtener el token de Clerk (SSE requiere esto via query param)
  const getSessionToken = async () => {
    if (!session) return null;
    return await session.getToken();
  };

  useRealtimeEvents({
    enabled: !!user,
    userId: user?.id,
    userName: user?.fullName || user?.username || 'Usuario',
    getSessionToken,
    onPlanillaChange: (event) => {
      subscribers.planillas.forEach(cb => cb(event));
    },
    onHojaChange: (event) => {
      subscribers.hojas.forEach(cb => cb(event));
    },
    onFlotaChange: (event) => {
      subscribers.flota.forEach(cb => cb(event));
    },
    onEvent: (event) => {
      subscribers.events.forEach(cb => cb(event));
    }
  });

  return (
    <RealtimeContext.Provider value={{}}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook para suscribirse a eventos de tiempo real sin crear nuevas conexiones SSE.
 */
export function useRealtimeSubscription() {
  const subscribe = (
    type: 'planillas' | 'hojas' | 'flota' | 'events',
    callback: (event: RealtimeEvent) => void
  ) => {
    subscribers[type].add(callback);
    // Retornar función de desuscripción para useEffect
    return () => {
      subscribers[type].delete(callback);
    };
  };

  return { subscribe };
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime debe usarse dentro de un RealtimeProvider');
  }
  return context;
}
