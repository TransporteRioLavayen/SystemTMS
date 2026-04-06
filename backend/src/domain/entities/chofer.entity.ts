// =============================================================================
// ENTITY: CHOFER
// =============================================================================
// Domain Layer - Entidad del dominio para choferes

export interface Chofer {
  id: string;
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
  estado: ChoferEstado;
  createdAt: Date;
  updatedAt: Date;
}

export type ChoferEstado = 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO';

export interface CreateChoferInput {
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
}

export interface UpdateChoferInput {
  nombre?: string;
  dni?: string;
  licencia?: string;
  vencimientoLicencia?: string;
  telefono?: string;
  estado?: ChoferEstado;
}