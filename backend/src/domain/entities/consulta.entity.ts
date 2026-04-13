// =============================================================================
// ENTITY: CONSULTA
// =============================================================================
// Domain Layer - Entidad del dominio para consultas desde la landing page

export type ConsultaTipo = 'reclamos' | 'alquiler_unidades' | 'cargas_especiales' | 'cargas_internacionales' | 'otro';

export type ConsultaEstado = 'pendiente' | 'en_proceso' | 'respondida' | 'cerrada';

export interface Consulta {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  tipoConsulta: ConsultaTipo;
  mensaje: string;
  estado: ConsultaEstado;
  respuesta?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConsultaInput {
  nombre: string;
  email: string;
  telefono?: string;
  tipoConsulta: ConsultaTipo;
  mensaje: string;
}

export interface UpdateConsultaInput {
  estado?: ConsultaEstado;
  respuesta?: string;
}
