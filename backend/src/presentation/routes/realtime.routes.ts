// =============================================================================
// REALTIME ROUTES - BACKEND
// =============================================================================
// Endpoints para Server-Sent Events (SSE) y presencia.
//
// NOTA: SSE no soporta headers de Authorization, por lo que el token
// se pasa via query param ?token=<clerk_session_token>.
// El handler de SSE valida el token internamente.

import { Router } from 'express';
import { sseHandler, pingHandler, presenceHandler } from '../../infrastructure/realtime/sse-server';

const router = Router();

// NOTA: SSE no puede usar requireAuth() porque EventSource no envía headers.
// La autenticación se valida dentro del sseHandler via query param token.

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Server-Sent Events stream
 *     description: >
 *       Abre una conexión SSE para recibir eventos en tiempo real.
 *       El cliente usa EventSource nativo del navegador.
 *
 *       Query params:
 *       - token: Clerk session token (requerido para autenticación)
 *       - userId: ID del usuario para presencia
 *       - userName: Nombre del usuario para presencia
 *       - tables: Filtrar por tablas (comma-separated, ej: "planillas,hojas_ruta")
 *       - actions: Filtrar por acciones (comma-separated, ej: "INSERT,UPDATE")
 *
 *       Eventos emitidos:
 *       - connected: Confirmación de conexión
 *       - realtime: Evento de cambio en la base de datos
 *       - presence: Actualización de usuarios online
 *       - ping: Heartbeat cada 30 segundos
 *     tags: [Realtime]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: userName
 *         schema: { type: string }
 *       - in: query
 *         name: tables
 *         schema: { type: string }
 *       - in: query
 *         name: actions
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stream SSE abierto
 *         content:
 *           text/event-stream:
 *             schema: { type: string }
 */
router.get('/events', sseHandler);

/**
 * @openapi
 * /api/events/ping:
 *   get:
 *     summary: SSE health check
 *     description: Verifica el estado del servidor SSE.
 *     tags: [Realtime]
 *     responses:
 *       200:
 *         description: Estado del servidor SSE
 */
router.get('/events/ping', pingHandler);

/**
 * @openapi
 * /api/events/presence:
 *   get:
 *     summary: Obtener usuarios online
 *     description: Lista de usuarios conectados via SSE.
 *     tags: [Realtime]
 *     responses:
 *       200:
 *         description: Lista de usuarios online
 */
router.get('/events/presence', presenceHandler);

export default router;
