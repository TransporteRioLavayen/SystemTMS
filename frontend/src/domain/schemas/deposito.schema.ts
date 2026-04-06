import { z } from 'zod';
import { ESTADOS_DEPOSITO } from '../constants/estados';

export const depositoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  ubicacion: z.string().min(1, 'Ubicación es requerida'),
  capacidad: z.number().int().positive('Capacidad debe ser mayor a 0'),
  encargado: z.string().optional().or(z.literal('')),
  lat: z.number().optional(),
  lng: z.number().optional(),
  gln: z.string().optional().or(z.literal('')),
  estado: z.nativeEnum(ESTADOS_DEPOSITO).optional(),
});

export type DepositoFormData = z.infer<typeof depositoSchema>;
