import { z } from 'zod';
import { ESTADOS_HOJA_RUTA } from '../constants/estados';

export const cargaSchema = z.object({
  remitoId: z.string().uuid().optional(),
  cliente: z.string().min(1, 'Cliente es requerido'),
  direccion: z.string().min(1, 'Dirección es requerida'),
  whatsapp: z.string().optional().or(z.literal('')),
  bultos: z.number().int().positive('Bultos debe ser positivo'),
});

export const hojaRutaSchema = z.object({
  unidad: z.string().min(1, 'Unidad es requerida'),
  chofer: z.string().min(1, 'Chofer es requerido'),
  acompanante: z.string().optional().or(z.literal('')),
  depositoOrigenId: z.string().uuid('Depósito inválido').optional().or(z.literal('')),
  tipoFlota: z.enum(['propia', 'tercero']).optional(),
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).optional(),
  estado: z.nativeEnum(ESTADOS_HOJA_RUTA).optional(),
  cargas: z.array(cargaSchema).optional(),
});

export type HojaRutaFormData = z.infer<typeof hojaRutaSchema>;
