// =============================================================================
// EVENT BUS - BACKEND
// =============================================================================
// EventEmitter interno para distribuir eventos de Supabase Realtime
// a los clientes SSE conectados.
//
// Arquitectura:
//   Supabase → supabase-realtime.ts → EventBus → SSE Clients
//
// Cada evento tiene un tipo (table:action) y un payload.
// Los clientes pueden filtrar por tipo al conectarse.

import { EventEmitter } from 'events';

export interface RealtimeEvent {
  id: string;
  type: string; // e.g. "planillas:insert", "hojas_ruta:update", "remitos:delete"
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
      EventBus.instance.setMaxListeners(100);
    }
    return EventBus.instance;
  }

  // Usamos dispatch para evitar conflicto con EventEmitter.emit
  dispatch(event: RealtimeEvent): boolean {
    // Emitir evento genérico
    this.emit('event', event);
    // Emitir evento específico por tabla
    this.emit(`table:${event.table}`, event);
    // Emitir evento específico por tipo
    this.emit(`${event.table}:${event.action.toLowerCase()}`, event);
    return true;
  }

  onEvent(callback: (event: RealtimeEvent) => void): () => void {
    this.on('event', callback);
    return () => this.off('event', callback);
  }

  onTable(table: string, callback: (event: RealtimeEvent) => void): () => void {
    this.on(`table:${table}`, callback);
    return () => this.off(`table:${table}`, callback);
  }
}

export const eventBus = EventBus.getInstance();
