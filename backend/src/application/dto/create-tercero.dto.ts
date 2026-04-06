// =============================================================================
// DTO: CREATE TERCERO
// =============================================================================
import { z } from 'zod';

export const CreateTerceroSchema = z.object({
  // Datos del titular/empresa
  razonSocial: z.string().min(1, 'La razón social es requerida').max(255),
  tipoDocumento: z.enum(['CUIT', 'DNI', 'CUIL']),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido').max(20),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Datos del vehículo
  patenteTractor: z.string().min(1, 'La patente del tractor es requerida').max(15),
  patenteAcoplado: z.string().max(15).optional(),
  tipoUnidad: z.enum(['Semi', 'Chasis', 'Acoplado', 'Utilitario']),
  vencimientoSeguro: z.string().optional(),
  vencimientoVtv: z.string().optional(),
  
  // Datos del chofer
  nombreChofer: z.string().max(255).optional(),
  dniChofer: z.string().max(10).optional(),
  vencimientoLicencia: z.string().optional(),
  vencimientoLinti: z.string().optional(),
  
  // Tipo de servicio
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).default('corta_distancia').optional(),
});

export type CreateTerceroDTO = z.infer<typeof CreateTerceroSchema>;