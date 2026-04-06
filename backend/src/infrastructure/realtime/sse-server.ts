// =============================================================================
// SSE SERVER - BACKEND
// =============================================================================
// Gestiona las conexiones SSE de los clientes del frontend.
// Cada cliente se conecta a /api/events y recibe eventos en tiempo real.
//
// Los clientes pueden enviar:
//   - lastEventId: para recibir eventos desde ese punto
//   - tables: filtro de tablas (comma-separated)
//   - actions: filtro de acciones (comma-separated)
//
// Presencia: Al conectarse, el cliente puede enviar un user-id via query param
// y el backend lo registra como "online". Al desconectarse, lo remueve.

import { Request, Response } from 'express';
import { eventBus, RealtimeEvent } from './event-bus';
import { logger } from '../logging/logger';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  userName?: string;
  filters: {
    tables?: Set<string>;
    actions?: Set<string>;
  };
  lastEventId?: string;
  connectedAt: string;
}

const clients = new Map<string, SSEClient>();
const eventHistory: RealtimeEvent[] = [];
const MAX_HISTORY = 100;

// Presencia
interface PresenceUser {
  id: string;
  name: string;
  connectedAt: string;
  lastPing: string;
}
const presenceUsers = new Map<string, PresenceUser>();

function formatSSE(event: string, data: any, id?: string): string {
  let message = '';
  if (id) message += `id: ${id}\n`;
  message += `event: ${event}\n`;
  message += `data: ${JSON.stringify(data)}\n\n`;
  return message;
}

function sendEventToClient(client: SSEClient, event: RealtimeEvent): void {
  // Aplicar filtros
  if (client.filters.tables && !client.filters.tables.has(event.table)) return;
  if (client.filters.actions && !client.filters.actions.has(event.action)) return;

  try {
    const sse = formatSSE('realtime', event, event.id);
    client.res.write(sse);
  } catch (err) {
    // Cliente desconectado, remover
    logger.error('[SSE] Cliente desconectado: %s', client.id);
  }
}

function broadcastPresence(): void {
  const users = Array.from(presenceUsers.values());
  const data = { users, count: users.length };
  const sse = formatSSE('presence', data);

  clients.forEach((client) => {
    try {
      client.res.write(sse);
    } catch {
      clients.delete(client.id);
    }
  });
}

export function sseHandler(req: Request, res: Response): void {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId = req.query.userId as string | undefined;
  const userName = req.query.userName as string | undefined;
  const tablesParam = req.query.tables as string | undefined;
  const actionsParam = req.query.actions as string | undefined;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const client: SSEClient = {
    id: clientId,
    res,
    userId,
    userName,
    filters: {
      tables: tablesParam ? new Set(tablesParam.split(',')) : undefined,
      actions: actionsParam ? new Set(actionsParam.split(',').map(a => a.toUpperCase() as any)) : undefined,
    },
    lastEventId,
    connectedAt: new Date().toISOString(),
  };

  clients.set(clientId, client);

  // Registrar presencia
  if (userId && userName) {
    presenceUsers.set(userId, {
      id: userId,
      name: userName,
      connectedAt: client.connectedAt,
      lastPing: client.connectedAt,
    });
    broadcastPresence();
  }

  logger.info('[SSE] Cliente conectado: %s (%s) | Total: %d', clientId, userName || 'anon', clients.size);

  // Enviar eventos pendientes si hay lastEventId
  if (lastEventId) {
    const idx = eventHistory.findIndex(e => e.id === lastEventId);
    if (idx !== -1) {
      const pending = eventHistory.slice(idx + 1);
      pending.forEach(event => sendEventToClient(client, event));
    }
  }

  // Enviar bienvenida
  res.write(formatSSE('connected', {
    clientId,
    message: 'Conectado al stream de eventos en tiempo real',
    presenceCount: presenceUsers.size,
  }));

  // Heartbeat cada 30s para mantener la conexión viva
  const heartbeat = setInterval(() => {
    try {
      res.write(formatSSE('ping', { timestamp: new Date().toISOString() }));
    } catch {
      clearInterval(heartbeat);
      clients.delete(clientId);
    }
  }, 30000);

  // Suscribirse al EventBus
  const unsubscribe = eventBus.onEvent((event) => {
    // Guardar en historial
    eventHistory.push(event);
    if (eventHistory.length > MAX_HISTORY) eventHistory.shift();

    sendEventToClient(client, event);
  });

  // Cleanup al desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    clients.delete(clientId);

    if (userId) {
      presenceUsers.delete(userId);
      broadcastPresence();
    }

    logger.info('[SSE] Cliente desconectado: %s | Total: %d', clientId, clients.size);
  });
}

// Endpoint para heartbeat manual desde frontend
export function pingHandler(_req: Request, res: Response): void {
  res.json({ ok: true, clients: clients.size, presence: presenceUsers.size });
}

// Endpoint para obtener presencia actual
export function presenceHandler(_req: Request, res: Response): void {
  res.json({
    users: Array.from(presenceUsers.values()),
    count: presenceUsers.size,
  });
}
