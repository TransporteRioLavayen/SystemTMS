// =============================================================================
// ENTITY: UNIDAD
// =============================================================================
// Domain Layer - Entidad del dominio para unidades de transporte

export interface Unidad {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string; // rígido, semirremolque, etc.
  vtv?: string; // vencimiento verificación técnica
  seguro?: string; // vencimiento seguro
  tipoServicio: UnidadTipoServicio;
  estado: UnidadEstado;
  createdAt: Date;
  updatedAt: Date;
}

export type UnidadEstado = 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
export type UnidadTipoServicio = 'larga_distancia' | 'corta_distancia';

export interface CreateUnidadInput {
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  vtv?: string;
  seguro?: string;
  tipoServicio?: UnidadTipoServicio;
}

export interface UpdateUnidadInput {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  tipo?: string;
  vtv?: string;
  seguro?: string;
  tipoServicio?: UnidadTipoServicio;
  estado?: UnidadEstado;
}