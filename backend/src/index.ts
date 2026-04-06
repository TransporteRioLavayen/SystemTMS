// Cargar variables de entorno - PRIMERO antes de cualquier import
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Request, Response as ExpressResponse, NextFunction } from 'express';
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
// CONFIGURACIÓN
// =============================================================================

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// =============================================================================
// MIDDLEWARES
// =============================================================================

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.options('*', cors());

app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  },
  skip: (req) => req.path.startsWith('/api/events'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Demasiados intentos. Intenta de nuevo más tarde.',
  },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk Middleware
app.use(clerkMiddleware());

app.use('/api/', generalLimiter);

// =============================================================================
// RUTAS
// =============================================================================

app.get('/api/health', (req: Request, res: ExpressResponse) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'transporte-rio-lavayen-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Swagger UI
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

app.use((req: Request, res: ExpressResponse) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  });
});

app.use((err: Error, req: Request, res: ExpressResponse, next: NextFunction) => {
  logger.error('Error: %s', err.message);
  logger.error(err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
  });
});

// =============================================================================
// INICIAR SERVIDOR
// =============================================================================

const server = app.listen(PORT, () => {
  logger.info(`
  ╔══════════════════════════════════════════════════════════════╗
  ║   TRANSPORTE RIO LAVAYEN - BACKEND                        ║
  ║   Servidor corriendo en: http://localhost:${PORT}               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                                 ║
  ╚══════════════════════════════════════════════════════════════╝
  `);

  setImmediate(() => {
    try {
      const supabase = startSupabaseRealtime();
      logger.info('[Supabase] Cliente pre-inicializado');
    } catch (err: any) {
      logger.warn('[Realtime] No se pudo iniciar Supabase o Realtime: %s', err.message);
    }
  });
});

export default app;
