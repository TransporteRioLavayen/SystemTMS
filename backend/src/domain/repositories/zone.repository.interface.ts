// =============================================================================
// INTERFAZ: ZONE REPOSITORY
// =============================================================================
// Domain Layer - Define el contrato que debe cumplir la implementación

import { Zone, CreateZoneInput, UpdateZoneInput } from '../entities/zone.entity';

export interface IZoneRepository {
  // Crear
  create(input: CreateZoneInput): Promise<Zone>;

  // Leer
  findById(id: string): Promise<Zone | null>;
  findByNumero(numero: number): Promise<Zone | null>;
  findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<Zone[]>;

  // Actualizar
  update(id: string, input: UpdateZoneInput): Promise<Zone>;

  // Eliminar
  delete(id: string): Promise<void>;

  // Existencia
  existsByNumero(numero: number): Promise<boolean>;
}
