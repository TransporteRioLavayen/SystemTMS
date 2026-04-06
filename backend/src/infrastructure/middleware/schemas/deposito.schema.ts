// =============================================================================
// VALIDATION SCHEMAS - DEPOSITO
// =============================================================================
// Schemas de validación Zod para el módulo Depósitos

import { z } from 'zod';

export const createDepositoSchema = z.object({
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(255),
  ubicacion: z.string().min(1, 'Ubicación es requerida').max(500),
  capacidad: z.number().int().positive('Capacidad debe ser un número positivo'),
  encargado: z.string().max(255).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const updateDepositoSchema = z.object({
  nombre: z.string().min(3).max(255).optional(),
  ubicacion: z.string().min(1).max(500).optional(),
  capacidad: z.number().int().positive().optional(),
  encargado: z.string().max(255).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type CreateDepositoInput = z.infer<typeof createDepositoSchema>;
export type UpdateDepositoInput = z.infer<typeof updateDepositoSchema>;
