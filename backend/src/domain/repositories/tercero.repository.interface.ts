// =============================================================================
// REPOSITORY INTERFACE: TERCERO
// =============================================================================
// Domain Layer - Interfaz del repositorio para terceros

import { Tercero, CreateTerceroInput, UpdateTerceroInput } from '../entities/tercero.entity';

export interface ITerceroRepository {
  findAll(includeInactive?: boolean): Promise<Tercero[]>;
  findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Tercero[]; total: number }>;
  findById(id: string): Promise<Tercero | null>;
  findByNombre(nombre: string): Promise<Tercero | null>;
  create(data: CreateTerceroInput): Promise<Tercero>;
  update(id: string, data: UpdateTerceroInput): Promise<Tercero>;
  delete(id: string): Promise<void>;
  existsByNombre(nombre: string): Promise<boolean>;
}