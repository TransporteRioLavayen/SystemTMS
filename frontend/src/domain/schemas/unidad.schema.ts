import { z } from 'zod';
import { TIPOS_UNIDAD, TIPOS_SERVICIO } from '../constants/tipos';
import { ESTADOS_UNIDAD } from '../constants/estados';

const currentYear = new Date().getFullYear();

export const unidadSchema = z.object({
  patente: z.string().min(6, 'Patente no válida').max(7, 'Patente no válida'),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  anio: z.string()
    .min(4, 'Año no válido')
    .refine((val) => {
      const year = parseInt(val, 10);
      return !isNaN(year) && year > 1980 && year <= currentYear + 1;
    }, 'Año no válido'),
  tipo: z.nativeEnum(TIPOS_UNIDAD, { error: 'El tipo es obligatorio' }),
  vtv: z.string().optional().or(z.literal('')),
  seguro: z.string().optional().or(z.literal('')),
  tipoServicio: z.nativeEnum(TIPOS_SERVICIO, { error: 'El tipo de servicio es obligatorio' }),
  estado: z.nativeEnum(ESTADOS_UNIDAD).optional(),
});

export type UnidadFormData = z.infer<typeof unidadSchema>;
