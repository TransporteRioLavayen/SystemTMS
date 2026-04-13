// =============================================================================
// DTO: CREATE COTIZACION
// =============================================================================
// Application Layer - DTO para crear una nueva cotización desde la landing page

import { z } from 'zod';

export const CreateCotizacionSchema = z.object({
  depositoOrigen: z.string().min(1, 'El depósito de origen es requerido'),
  zonaDestino: z.number().int().min(1).max(4, 'La zona debe ser entre 1 y 4'),
  localidadDestino: z.string().min(1, 'La localidad de destino es requerida'),
  tipoCarga: z.string().min(1, 'El tipo de carga es requerido'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
  valorDeclarado: z.number().min(0, 'El valor declarado no puede ser negativo').default(0),
  incluirIva: z.boolean().default(false),
  entregaDomicilio: z.boolean().default(false),
});

export type CreateCotizacionDto = z.infer<typeof CreateCotizacionSchema>;