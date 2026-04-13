// =============================================================================
// DTO: UPDATE CONSULTA
// =============================================================================
// Application Layer - Data Transfer Object para actualizar una consulta

import { z } from 'zod';

export const UpdateConsultaSchema = z.object({
  estado: z.enum(['pendiente', 'en_proceso', 'respondida', 'cerrada'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).optional(),
  respuesta: z.string()
    .max(2000, 'La respuesta no puede exceder 2000 caracteres')
    .optional(),
});

export type UpdateConsultaDTO = z.infer<typeof UpdateConsultaSchema>;
