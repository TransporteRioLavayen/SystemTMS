// =============================================================================
// DTO: UPDATE UNIDAD
// =============================================================================
import { z } from 'zod';

export const UpdateUnidadSchema = z.object({
  patente: z.string().min(1).max(20).optional(),
  marca: z.string().min(1).max(50).optional(),
  modelo: z.string().min(1).max(50).optional(),
  anio: z.string().min(1).max(4).optional(),
  tipo: z.string().min(1).max(50).optional(),
  vtv: z.string().optional(),
  seguro: z.string().optional(),
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).optional(),
  estado: z.enum(['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO']).optional(),
});

export type UpdateUnidadDTO = z.infer<typeof UpdateUnidadSchema>;