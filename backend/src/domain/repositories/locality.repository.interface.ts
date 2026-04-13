// =============================================================================
// INTERFAZ: LOCALITY REPOSITORY
// =============================================================================
// Domain Layer

import { Locality, CreateLocalityInput, UpdateLocalityInput } from '../entities/locality.entity';

export interface ILocalityRepository {
  // Crear
  create(input: CreateLocalityInput): Promise<Locality>;

  // Leer
  findById(id: string): Promise<Locality | null>;
  findByZoneId(zoneId: string): Promise<Locality[]>;
  findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<Locality[]>;

  // Búsqueda por coordenadas (útil para geolocalización)
  findNearby(lat: number, lng: number, radiusKm: number): Promise<Locality[]>;

  // Actualizar
  update(id: string, input: UpdateLocalityInput): Promise<Locality>;

  // Eliminar
  delete(id: string): Promise<void>;

  // Cascada: marcar inactivas todas las localidades de una zona
  deactivateByZoneId(zoneId: string): Promise<void>;
}
