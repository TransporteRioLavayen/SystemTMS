// =============================================================================
// LOGGER — Pino Structured Logging
// =============================================================================
// Infrastructure Layer - Logger centralizado para toda la aplicación
// 
// En desarrollo: output legible con colores (pino-pretty)
// En producción: JSON estructurado para agregación (DataDog, CloudWatch, etc.)

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // En producción: JSON puro
});
