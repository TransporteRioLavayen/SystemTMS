// =============================================================================
// FINALIZAR CONTROL DTO - BACKEND
// =============================================================================

import { z } from 'zod';

export const FinalizarControlRemitoSchema = z.object({
  id: z.string().uuid({ message: 'ID de remito inválido' }),
  bultosRecibidos: z.number().int().min(0, { message: 'Los bultos recibidos deben ser un número entero positivo' }),
  pesoTotal: z.number().min(0, { message: 'El peso debe ser un número positivo' }),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  whatsapp: z.string().length(10, { message: 'El WhatsApp debe tener exactamente 10 dígitos' }),
});

export const FinalizarControlSchema = z.object({
  remitos: z.array(FinalizarControlRemitoSchema).min(1, { message: 'Debe proporcionar al menos un remito' }),
});

export type FinalizarControlDto = z.infer<typeof FinalizarControlSchema>;
export type FinalizarControlRemitoDto = z.infer<typeof FinalizarControlRemitoSchema>;