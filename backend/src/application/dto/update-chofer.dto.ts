// =============================================================================
// DTO: UPDATE CHOFER
// =============================================================================
import { z } from 'zod';

export const UpdateChoferSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  dni: z.string().min(1).max(20).optional(),
  licencia: z.string().min(1).max(50).optional(),
  vencimientoLicencia: z.string().optional(),
  telefono: z.string().min(1).max(20).optional(),
  estado: z.enum(['DISPONIBLE', 'EN_RUTA', 'INACTIVO']).optional(),
});

export type UpdateChoferDTO = z.infer<typeof UpdateChoferSchema>;