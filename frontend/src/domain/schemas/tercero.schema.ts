import { z } from 'zod';
import { TIPOS_DOCUMENTO, TIPOS_TERCERO_UNIDAD, TIPOS_SERVICIO } from '../constants/tipos';
import { ESTADOS_TERCERO } from '../constants/estados';

export const terceroSchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es obligatoria'),
  tipoDocumento: z.nativeEnum(TIPOS_DOCUMENTO),
  numeroDocumento: z.string().min(7, 'Documento no válido'),
  telefono: z.string().optional().or(z.literal('')),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  
  patenteTractor: z.string().min(6, 'Patente no válida').max(7, 'Patente no válida'),
  patenteAcoplado: z.string().max(7, 'Patente no válida').optional().or(z.literal('')),
  tipoUnidad: z.nativeEnum(TIPOS_TERCERO_UNIDAD),
  vencimientoSeguro: z.string().optional().or(z.literal('')),
  vencimientoVtv: z.string().optional().or(z.literal('')),
  
  nombreChofer: z.string().optional().or(z.literal('')),
  dniChofer: z.string().optional().or(z.literal('')),
  vencimientoLicencia: z.string().optional().or(z.literal('')),
  vencimientoLinti: z.string().optional().or(z.literal('')),
  
  tipoServicio: z.nativeEnum(TIPOS_SERVICIO, { error: 'El tipo de servicio es obligatorio' }),
  estado: z.nativeEnum(ESTADOS_TERCERO).optional(),
});

export type TerceroFormData = z.infer<typeof terceroSchema>;
