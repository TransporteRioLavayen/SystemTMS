// =============================================================================
// DTO: CREATE CHOFER
// =============================================================================
import { z } from 'zod';

export const CreateChoferSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  dni: z.string().min(1, 'El DNI es requerido').max(20),
  licencia: z.string().min(1, 'La licencia es requerida').max(50),
  vencimientoLicencia: z.string().min(1, 'El vencimiento de licencia es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20),
});

export type CreateChoferDTO = z.infer<typeof CreateChoferSchema>;