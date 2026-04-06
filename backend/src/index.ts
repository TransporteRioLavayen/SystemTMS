// Cargar variables de entorno - PRIMERO antes de cualquier import
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { getSwaggerSpec } from './config/swagger';

// Clerk Auth
import { clerkMiddleware } from '@clerk/express';

// Rutas
import authRoutes from './presentation/routes/auth.routes';
import depositoRoutes from './presentation/routes/deposito.routes';
import unidadRoutes from './presentation/routes/unidad.routes';
import choferRoutes from './presentation/routes/chofer.routes';
import terceroRoutes from './presentation/routes/tercero.routes';
import planillaRoutes from './presentation/routes/planilla.routes';
import hojaRutaRoutes from './presentation/routes/hoja-ruta.routes';
import realtimeRoutes from './presentation/routes/realtime.routes';
import barcodeRoutes from './presentation/routes/barcode.routes';
import analyticsRoutes from './presentation/routes/analytics.routes';

// Realtime
import { startSupabaseRealtime } from './infrastructure/realtime/supabase-realtime';
import { logger } from './infrastructure/logging/logger';

// =============================================================================
// DETECCIÓN DE ENTORNO: Cloudflare Workers vs Desarrollo Local
// =============================================================================

const isCloudflare = process.env.CF_PAGES || process.env.WORKER_ENV || process.env.__WRANGLER__;

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// =============================================================================
// MIDDLEWARES
// =============================================================================

// CORS - permitir todos los orígenes en desarrollo
// En producción, reemplazar con el dominio de Cloudflare Pages
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Preflight requests
app.options('*', cors());

// Seguridad - Headers HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desactivado para desarrollo; habilitar en producción
}));

// Rate Limiting - Protección contra abuso
// Límite general: 200 requests por ventana de 15 minutos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  },
  skip: (req) => req.path.startsWith('/api/events'), // No limitar SSE
});

// Límite estricto para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Demasiados intentos. Intenta de nuevo más tarde.',
  },
});

// Body parsing - con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk Middleware
app.use(clerkMiddleware());

// Aplicar rate limiting
app.use('/api/', generalLimiter);

// =============================================================================
// RUTAS
// =============================================================================

// Health check (público, sin rate limiting estricto)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'transporte-rio-lavayen-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Swagger UI - Documentación de la API (público)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(getSwaggerSpec(), {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TransporteRioLavayen API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  },
}));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/depositos', depositoRoutes);
app.use('/api/unidades', unidadRoutes);
app.use('/api/choferes', choferRoutes);
app.use('/api/terceros', terceroRoutes);
app.use('/api/planillas', planillaRoutes);
app.use('/api/hojas-ruta', hojaRutaRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', realtimeRoutes);

// =============================================================================
// ERROR HANDLERS
// =============================================================================

// 404 - Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  });
});

// 500 - Internal Server Error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error: %s', err.message);
  logger.error(err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  });
});

// =============================================================================
// INICIAR SERVIDOR (Solo en desarrollo local)
// =============================================================================

// Función para iniciar el servidor de desarrollo
function startDevServer() {
  const server = app.listen(PORT, () => {
    logger.info(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   TRANSPORTE RIO LAVAYEN - BACKEND                        ║
  ║   ═══════════════════════════════════════════════════════════ ║
  ║                                                              ║
  ║   Servidor corriendo en: http://localhost:${PORT}               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                                 ║
  ║   Health: http://localhost:${PORT}/api/health                   ║
  ║   Swagger UI: http://localhost:${PORT}/api-docs                 ║
  ║   Auth: Clerk (@clerk/express)                                ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
    `);

    // Realtime se inicia DESPUÉS de que el servidor está escuchando
    setImmediate(() => {
      try {
        const supabase = startSupabaseRealtime();
        logger.info('[Supabase] Cliente pre-inicializado');
      } catch (err: any) {
        logger.warn('[Realtime] No se pudo iniciar Supabase o Realtime: %s', err.message);
      }
    });
  });

  return server;
}

// =============================================================================
// CLOUDFLARE WORKERS HANDLER (nodejs_compat)
// =============================================================================

// Con nodejs_compat, Cloudflare Workers puede ejecutar Express directamente
// usando el módulo node:http

import { createServer } from 'node:http';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Setear variables de entorno desde Cloudflare
    if (env) {
      Object.keys(env).forEach(key => {
        if (!process.env[key]) {
          process.env[key] = env[key];
        }
      });
    }

    // Convertir Request de Cloudflare a Request de Node.js
    const url = new URL(request.url);
    
    const nodeReq = {
      method: request.method,
      url: request.url,
      path: url.pathname,
      query: url.searchParams.toString(),
      headers: Object.fromEntries(request.headers),
      body: request.body,
    } as any;

    // Crear respuesta mock
    let responseStatus = 200;
    const responseHeaders: Record<string, string> = {};
    let responseBody = '';

    const nodeRes = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        responseHeaders[name] = value;
        return this;
      },
      getHeader(name: string) {
        return responseHeaders[name];
      },
      status(code: number) {
        responseStatus = code;
        return this;
      },
      send(data: any) {
        responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        return this;
      },
      json(data: any) {
        responseBody = JSON.stringify(data);
        responseHeaders['Content-Type'] = 'application/json';
        return this;
      },
      end(data?: any) {
        if (data) {
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        }
      },
    } as any;

    // Ejecutar Express
    await new Promise<void>((resolve) => {
      app(nodeReq, nodeRes, () => {
        // Next function (no-op)
        resolve();
      });
    });

    // Devolver Response de Cloudflare
    return new Response(responseBody, {
      status: responseStatus,
      headers: responseHeaders,
    });
  },
};

// Iniciar servidor solo si NO estamos en Cloudflare
if (!isCloudflare) {
  startDevServer();
}

export { app };
