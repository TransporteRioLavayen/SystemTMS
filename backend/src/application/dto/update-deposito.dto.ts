// =============================================================================
// DTO: UPDATE DEPOSITO
// =============================================================================
// Application Layer - Data Transfer Object para actualizar un depósito

import { z } from 'zod';

export const UpdateDepositoSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .optional(),
  ubicacion: z.string()
    .min(1, 'La ubicación es obligatoria')
    .max(500, 'La ubicación no puede exceder 500 caracteres')
    .optional(),
  capacidad: z.number()
    .positive('La capacidad debe ser un número positivo')
    .optional(),
  encargado: z.string()
    .max(255, 'El encargado no puede exceder 255 caracteres')
    .optional()
    .nullable(),
  lat: z.number()
    .min(-90, 'La latitud debe estar entre -90 y 90')
    .max(90, 'La latitud debe estar entre -90 y 90')
    .optional()
    .nullable(),
  lng: z.number()
    .min(-180, 'La longitud debe estar entre -180 y 180')
    .max(180, 'La longitud debe estar entre -180 y 180')
    .optional()
    .nullable(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type UpdateDepositoDTO = z.infer<typeof UpdateDepositoSchema>;