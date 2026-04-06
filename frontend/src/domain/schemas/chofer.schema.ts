import { z } from 'zod';
import { ESTADOS_CHOFER } from '../constants/estados';

export const choferSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  dni: z.string().min(7, 'DNI no válido').max(9, 'DNI no válido'),
  licencia: z.string().min(1, 'La licencia es obligatoria'),
  vencimientoLicencia: z.string().min(1, 'La fecha de vencimiento es obligatoria').refine((date) => {
    return new Date(date) >= new Date();
  }, 'La licencia está vencida'),
  telefono: z.string().min(6, 'El teléfono no es válido'),
  estado: z.nativeEnum(ESTADOS_CHOFER).optional(),
});

export type ChoferFormData = z.infer<typeof choferSchema>;
