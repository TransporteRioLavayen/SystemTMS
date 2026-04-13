// =============================================================================
// SCHEMA: CONSULTA
// =============================================================================
// Infrastructure Layer - Schema de validación Zod para consultas

import { z } from 'zod';

export const createConsultaSchema = z.object({
  nombre: z.string().min(2).max(255),
  email: z.string().email(),
  telefono: z.string().optional(),
  tipoConsulta: z.enum(['reclamos', 'alquiler_unidades', 'cargas_especiales', 'cargas_internacionales', 'otro']),
  mensaje: z.string().min(10).max(2000),
});

export const updateConsultaSchema = z.object({
  estado: z.enum(['pendiente', 'en_proceso', 'respondida', 'cerrada']).optional(),
  respuesta: z.string().max(2000).optional(),
});
