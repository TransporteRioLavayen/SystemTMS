// =============================================================================
// DTO: CREATE UNIDAD
// =============================================================================
import { z } from 'zod';

export const CreateUnidadSchema = z.object({
  patente: z.string().min(1, 'La patente es requerida').max(20),
  marca: z.string().min(1, 'La marca es requerida').max(50),
  modelo: z.string().min(1, 'El modelo es requerido').max(50),
  anio: z.string().min(1, 'El año es requerido').max(4),
  tipo: z.string().min(1, 'El tipo es requerido').max(50),
  vtv: z.string().optional(),
  seguro: z.string().optional(),
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).default('corta_distancia').optional(),
});

export type CreateUnidadDTO = z.infer<typeof CreateUnidadSchema>;