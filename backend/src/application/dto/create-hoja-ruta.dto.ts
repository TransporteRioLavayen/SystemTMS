// =============================================================================
// CREATE HOJA DE RUTA DTO - BACKEND
// =============================================================================

import { z } from 'zod';

export const CreateHojaDeRutaSchema = z.object({
  unidad: z.string().min(1, { message: 'La unidad es requerida' }),
  chofer: z.string().min(1, { message: 'El chofer es requerido' }),
  acompanante: z.string().optional(),
  depositoOrigenId: z.string().uuid({ message: 'El depósito de origen es requerido' }).optional(),
  tipoFlota: z.enum(['propia', 'tercero']).default('propia').optional(),
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).default('corta_distancia').optional(),
  cargas: z.array(z.object({
    remitoId: z.string().optional(),
    cliente: z.string().min(1),
    direccion: z.string().min(1),
    whatsapp: z.string().optional(),
    bultos: z.number().int().min(1),
  })).optional(),
});

export type CreateHojaDeRutaDto = z.infer<typeof CreateHojaDeRutaSchema>;