import { z } from 'zod';
import { ESTADOS_PLANILLA } from '../constants/estados';

export const remitoSchema = z.object({
  remitente: z.string().min(1, 'Remitente es requerido'),
  numeroRemito: z.string().min(1, 'Número de remito es requerido'),
  destinatario: z.string().min(1, 'Destinatario es requerido'),
  bultos: z.number().int().positive('Bultos debe ser positivo'),
  valorDeclarado: z.number().nonnegative('Valor declarado no puede ser negativo'),
  direccion: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
});

export const planillaSchema = z.object({
  sucursalOrigen: z.string().min(1, 'Sucursal de origen es requerida'),
  sucursalDestino: z.string().optional().or(z.literal('')),
  fechaSalidaEstimada: z.string().optional().or(z.literal('')),
  fechaLlegadaEstimada: z.string().optional().or(z.literal('')),
  camion: z.string().optional().or(z.literal('')),
  chofer: z.string().optional().or(z.literal('')),
  comentarios: z.string().optional().or(z.literal('')),
  estado: z.nativeEnum(ESTADOS_PLANILLA).optional(),
  remitos: z.array(remitoSchema).optional(),
});

export type PlanillaFormData = z.infer<typeof planillaSchema>;
