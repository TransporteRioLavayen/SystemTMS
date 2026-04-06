// =============================================================================
// VALIDATION SCHEMAS - HOJA DE RUTA
// =============================================================================
// Schemas de validación Zod para el módulo Hojas de Ruta

import { z } from 'zod';

// Schema para una carga en hoja de ruta
export const cargaSchema = z.object({
  remitoId: z.string().uuid().optional(),
  cliente: z.string().min(1, 'Cliente es requerido'),
  direccion: z.string().min(1, 'Dirección es requerida'),
  whatsapp: z.string().optional(),
  bultos: z.number().int().positive('Bultos debe ser positivo'),
});

export const createHojaRutaSchema = z.object({
  unidad: z.string().min(1, 'Unidad es requerida'),
  chofer: z.string().min(1, 'Chofer es requerido'),
  acompanante: z.string().optional(),
  depositoOrigenId: z.string().uuid().optional(),
  tipoFlota: z.enum(['propia', 'tercero']).optional().default('propia'),
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).optional().default('corta_distancia'),
  cargas: z.array(cargaSchema).optional().default([]),
});

export const iniciarTurnoSchema = z.object({
  kmSalida: z.number().int().positive('KM de salida es requerido'),
});

export const terminarTurnoSchema = z.object({
  kmLlegada: z.number().int().positive('KM de llegada es requerido'),
});

export const actualizarEstadoRemitoSchema = z.object({
  estado: z.enum(['En Base', 'En reparto', 'Entregado', 'Rechazado']),
  motivoRechazo: z.string().optional(),
  notasRechazo: z.string().optional(),
}).refine(data => {
  if (data.estado === 'Rechazado' && !data.motivoRechazo) {
    return false;
  }
  return true;
}, {
  message: 'Motivo de rechazo es requerido cuando el estado es Rechazado',
  path: ['motivoRechazo'],
});

export type CreateHojaRutaInput = z.infer<typeof createHojaRutaSchema>;
export type IniciarTurnoInput = z.infer<typeof iniciarTurnoSchema>;
export type TerminarTurnoInput = z.infer<typeof terminarTurnoSchema>;
export type ActualizarEstadoRemitoInput = z.infer<typeof actualizarEstadoRemitoSchema>;
