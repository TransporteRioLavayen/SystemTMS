// =============================================================================
// REPOSITORY INTERFACE: UNIDAD
// =============================================================================
// Domain Layer - Interfaz del repositorio para unidades

import { Unidad, CreateUnidadInput, UpdateUnidadInput } from '../entities/unidad.entity';

export interface IUnidadRepository {
  findAll(includeInactive?: boolean): Promise<Unidad[]>;
  findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Unidad[]; total: number }>;
  findById(id: string): Promise<Unidad | null>;
  findByPatente(patente: string): Promise<Unidad | null>;
  create(data: CreateUnidadInput): Promise<Unidad>;
  update(id: string, data: UpdateUnidadInput): Promise<Unidad>;
  delete(id: string): Promise<void>;
  existsByPatente(patente: string): Promise<boolean>;
}