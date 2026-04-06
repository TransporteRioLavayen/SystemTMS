// =============================================================================
// SUPABASE REALTIME SUBSCRIPTIONS - BACKEND
// =============================================================================
// El backend se suscribe a TODAS las tablas de Supabase via Realtime.
// Cuando detecta un cambio, lo emite al EventBus para que los clientes
// SSE conectados reciban la notificación.
//
// Estrategia: postgres_changes en cada tabla relevante.
// El backend usa la service_role key para tener acceso total.

import { getSupabaseClient } from '../database/supabase/client';
import { eventBus, RealtimeEvent } from './event-bus';
import { logger } from '../logging/logger';

const TABLES = [
  'planillas',
  'remitos',
  'hojas_ruta',
  'hoja_ruta_remitos',
  'choferes',
  'unidades',
  'depositos',
  'terceros',
  'tracking_events',
  'users',
];

let channels: any[] = [];

export function startSupabaseRealtime(): void {
  const supabase = getSupabaseClient();

  logger.info('[Supabase Realtime] Iniciando suscripciones...');

  TABLES.forEach((table) => {
    const channel = supabase
      .channel(`backend:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const newId = (payload.new as any)?.id;
          const oldId = (payload.old as any)?.id;
          const event: RealtimeEvent = {
            id: `${table}-${newId || oldId || Date.now()}-${payload.eventType}`,
            type: `${table}:${payload.eventType.toLowerCase()}`,
            table,
            action: payload.eventType as RealtimeEvent['action'],
            payload: {
              new: payload.new,
              old: payload.old,
            },
            timestamp: new Date().toISOString(),
          };

          logger.info('[Realtime] %s:%s → %s', table, payload.eventType, event.id);
          eventBus.dispatch(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[Realtime] Suscrito a %s', table);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[Realtime] Error en canal de %s', table);
        }
      });

    channels.push(channel);
  });

  logger.info('[Supabase Realtime] %d tablas suscritas.', TABLES.length);
}

export function stopSupabaseRealtime(): void {
  const supabase = getSupabaseClient();

  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels = [];

  logger.info('[Supabase Realtime] Todas las suscripciones cerradas.');
}
