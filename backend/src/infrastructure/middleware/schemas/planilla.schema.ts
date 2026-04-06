// =============================================================================
// VALIDATION SCHEMAS - PLANILLA
// =============================================================================
// Schemas de validación Zod para el módulo Planillas

import { z } from 'zod';

// Schema para un remito dentro de una planilla
export const remitoSchema = z.object({
  remitente: z.string().min(1, 'Remitente es requerido'),
  numeroRemito: z.string().min(1, 'Número de remito es requerido'),
  destinatario: z.string().min(1, 'Destinatario es requerido'),
  bultos: z.number().int().positive('Bultos debe ser positivo'),
  valorDeclarado: z.number().nonnegative('Valor declarado no puede ser negativo'),
  direccion: z.string().optional(),
  whatsapp: z.string().optional(),
});

export const createPlanillaSchema = z.object({
  sucursalOrigen: z.string().min(1, 'Sucursal de origen es requerida'),
  sucursalDestino: z.string().optional(),
  fechaSalidaEstimada: z.string().optional(),
  fechaLlegadaEstimada: z.string().optional(),
  camion: z.string().optional(),
  chofer: z.string().optional(),
  comentarios: z.string().optional(),
  remitos: z.array(remitoSchema).optional(),
});

export const updatePlanillaSchema = z.object({
  sucursalOrigen: z.string().min(1).optional(),
  sucursalDestino: z.string().optional(),
  fechaSalidaEstimada: z.string().optional(),
  fechaLlegadaEstimada: z.string().optional(),
  camion: z.string().optional(),
  chofer: z.string().optional(),
  estado: z.enum(['borrador', 'viaje', 'control', 'completo', 'incompleto']).optional(),
  comentarios: z.string().optional(),
  kmSalida: z.number().int().nonnegative().optional(),
  kmLlegada: z.number().int().nonnegative().optional(),
  remitos: z.array(remitoSchema).optional(),
});

export const confirmarViajeSchema = z.object({
  kmSalida: z.number().int().positive('KM de salida es requerido y debe ser positivo'),
});

export const confirmarLlegadaSchema = z.object({
  kmLlegada: z.number().int().positive('KM de llegada es requerido y debe ser positivo'),
});

export const finalizarControlRemitoSchema = z.object({
  id: z.string().uuid('ID de remito inválido'),
  bultosRecibidos: z.number().int().nonnegative(),
  pesoTotal: z.number().nonnegative(),
  direccion: z.string().min(1, 'Dirección es requerida'),
  whatsapp: z.string().length(10, 'WhatsApp debe tener 10 dígitos'),
});

export const finalizarControlSchema = z.object({
  remitos: z.array(finalizarControlRemitoSchema).min(1, 'Al menos un remito es requerido'),
});

export type CreatePlanillaInput = z.infer<typeof createPlanillaSchema>;
export type UpdatePlanillaInput = z.infer<typeof updatePlanillaSchema>;
export type ConfirmarViajeInput = z.infer<typeof confirmarViajeSchema>;
export type ConfirmarLlegadaInput = z.infer<typeof confirmarLlegadaSchema>;
export type FinalizarControlInput = z.infer<typeof finalizarControlSchema>;
