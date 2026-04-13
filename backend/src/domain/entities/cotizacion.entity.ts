// =============================================================================
// ENTITY: COTIZACION
// =============================================================================
// Domain Layer - Entidad del dominio para cotizaciones desde la landing page

export interface Cotizacion {
  id: string;
  depositoOrigen: string;
  zonaDestino: number;
  localidadDestino: string;
  tipoCarga: string;
  cantidad: number;
  valorDeclarado: number;
  incluirIva: boolean;
  entregaDomicilio: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCotizacionInput {
  depositoOrigen: string;
  zonaDestino: number;
  localidadDestino: string;
  tipoCarga: string;
  cantidad: number;
  valorDeclarado: number;
  incluirIva: boolean;
  entregaDomicilio: boolean;
}