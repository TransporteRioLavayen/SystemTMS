// =============================================================================
// DTO: UPDATE TERCERO
// =============================================================================
import { z } from 'zod';

export const UpdateTerceroSchema = z.object({
  // Datos del titular/empresa
  razonSocial: z.string().min(1).max(255).optional(),
  tipoDocumento: z.enum(['CUIT', 'DNI', 'CUIL']).optional(),
  numeroDocumento: z.string().min(1).max(20).optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Datos del vehículo
  patenteTractor: z.string().min(1).max(15).optional(),
  patenteAcoplado: z.string().max(15).optional(),
  tipoUnidad: z.enum(['Semi', 'Chasis', 'Acoplado', 'Utilitario']).optional(),
  vencimientoSeguro: z.string().optional(),
  vencimientoVtv: z.string().optional(),
  
  // Datos del chofer
  nombreChofer: z.string().max(255).optional(),
  dniChofer: z.string().max(10).optional(),
  vencimientoLicencia: z.string().optional(),
  vencimientoLinti: z.string().optional(),
  
  // Tipo de servicio
  tipoServicio: z.enum(['larga_distancia', 'corta_distancia']).optional(),
  
  // Estado
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type UpdateTerceroDTO = z.infer<typeof UpdateTerceroSchema>;