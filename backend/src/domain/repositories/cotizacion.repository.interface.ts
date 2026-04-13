// =============================================================================
// REPOSITORY INTERFACE: COTIZACION
// =============================================================================
// Domain Layer - Contrato del repositorio de cotizaciones

import { Cotizacion, CreateCotizacionInput } from '../entities/cotizacion.entity';

export interface ICotizacionRepository {
  findAllPaginated(options: { offset: number; limit: number }): Promise<{ data: Cotizacion[]; total: number }>;
  findById(id: string): Promise<Cotizacion | null>;
  create(data: CreateCotizacionInput): Promise<Cotizacion>;
  delete(id: string): Promise<void>;
}