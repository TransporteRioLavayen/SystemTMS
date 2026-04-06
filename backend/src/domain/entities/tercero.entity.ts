// =============================================================================
// ENTITY: TERCERO
// =============================================================================
// Domain Layer - Entidad del dominio para terceros (proveedores/clientes/transportistas)

export interface Tercero {
  id: string;
  // Datos del titular/empresa
  razonSocial: string;
  tipoDocumento: 'CUIT' | 'DNI' | 'CUIL';
  numeroDocumento: string;
  telefono?: string;
  email?: string;
  
  // Datos del vehículo
  patenteTractor: string;
  patenteAcoplado?: string;
  tipoUnidad: 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario';
  vencimientoSeguro?: string;
  vencimientoVtv?: string;
  
  // Datos del chofer
  nombreChofer?: string;
  dniChofer?: string;
  vencimientoLicencia?: string;
  vencimientoLinti?: string;
  
  // Tipo de servicio
  tipoServicio: TerceroTipoServicio;
  
  // Estado y metadata
  estado: TerceroEstado;
  createdAt: Date;
  updatedAt: Date;
}

export type TerceroEstado = 'activo' | 'inactivo';
export type TerceroTipoServicio = 'larga_distancia' | 'corta_distancia';

export interface CreateTerceroInput {
  // Datos del titular/empresa
  razonSocial: string;
  tipoDocumento: 'CUIT' | 'DNI' | 'CUIL';
  numeroDocumento: string;
  telefono?: string;
  email?: string;
  
  // Datos del vehículo
  patenteTractor: string;
  patenteAcoplado?: string;
  tipoUnidad: 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario';
  vencimientoSeguro?: string;
  vencimientoVtv?: string;
  
  // Datos del chofer
  nombreChofer?: string;
  dniChofer?: string;
  vencimientoLicencia?: string;
  vencimientoLinti?: string;
  
  // Tipo de servicio
  tipoServicio?: TerceroTipoServicio;
}

export interface UpdateTerceroInput {
  // Datos del titular/empresa
  razonSocial?: string;
  tipoDocumento?: 'CUIT' | 'DNI' | 'CUIL';
  numeroDocumento?: string;
  telefono?: string;
  email?: string;
  
  // Datos del vehículo
  patenteTractor?: string;
  patenteAcoplado?: string;
  tipoUnidad?: 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario';
  vencimientoSeguro?: string;
  vencimientoVtv?: string;
  
  // Datos del chofer
  nombreChofer?: string;
  dniChofer?: string;
  vencimientoLicencia?: string;
  vencimientoLinti?: string;
  
  // Tipo de servicio
  tipoServicio?: TerceroTipoServicio;
  
  // Estado
  estado?: TerceroEstado;
}
