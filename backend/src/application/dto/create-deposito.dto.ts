// =============================================================================
// DTO: CREATE DEPOSITO
// =============================================================================
// Application Layer - Data Transfer Object para crear un depósito

import { z } from 'zod';

export const CreateDepositoSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  ubicacion: z.string()
    .min(1, 'La ubicación es obligatoria')
    .max(500, 'La ubicación no puede exceder 500 caracteres'),
  capacidad: z.number()
    .positive('La capacidad debe ser un número positivo'),
  encargado: z.string()
    .max(255, 'El encargado no puede exceder 255 caracteres')
    .optional(),
  lat: z.number()
    .min(-90, 'La latitud debe estar entre -90 y 90')
    .max(90, 'La latitud debe estar entre -90 y 90')
    .optional(),
  lng: z.number()
    .min(-180, 'La longitud debe estar entre -180 y 180')
    .max(180, 'La longitud debe estar entre -180 y 180')
    .optional(),
});

export type CreateDepositoDTO = z.infer<typeof CreateDepositoSchema>;