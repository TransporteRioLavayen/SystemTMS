// =============================================================================
// DTO: CREATE CONSULTA
// =============================================================================
// Application Layer - Data Transfer Object para crear una consulta

import { z } from 'zod';

export const CreateConsultaSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  email: z.string()
    .email('Email inválido'),
  telefono: z.string()
    .optional(),
  tipoConsulta: z.enum([
    'reclamos',
    'alquiler_unidades',
    'cargas_especiales',
    'cargas_internacionales',
    'otro',
  ], { errorMap: () => ({ message: 'Tipo de consulta inválido' }) }),
  mensaje: z.string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres'),
});

export type CreateConsultaDTO = z.infer<typeof CreateConsultaSchema>;
