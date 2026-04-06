// =============================================================================
// REPOSITORY INTERFACE: CHOFER
// =============================================================================
// Domain Layer - Interfaz del repositorio para choferes

import { Chofer, CreateChoferInput, UpdateChoferInput } from '../entities/chofer.entity';

export interface IChoferRepository {
  findAll(includeInactive?: boolean): Promise<Chofer[]>;
  findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Chofer[]; total: number }>;
  findById(id: string): Promise<Chofer | null>;
  findByDni(dni: string): Promise<Chofer | null>;
  create(data: CreateChoferInput): Promise<Chofer>;
  update(id: string, data: UpdateChoferInput): Promise<Chofer>;
  delete(id: string): Promise<void>;
  existsByDni(dni: string): Promise<boolean>;
}