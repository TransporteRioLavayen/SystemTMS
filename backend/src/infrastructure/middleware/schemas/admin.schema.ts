// =============================================================================
// VALIDATION SCHEMAS - ADMIN
// =============================================================================
// Schemas de validación Zod para gestión de usuarios (admin)

import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['SUPERVISOR', 'OPERADOR', 'CHOFER']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['SUPERVISOR', 'OPERADOR', 'CHOFER'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser SUPERVISOR, OPERADOR o CHOFER' }),
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
