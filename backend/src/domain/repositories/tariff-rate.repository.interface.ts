// =============================================================================
// INTERFAZ: TARIFF_RATE REPOSITORY
// =============================================================================
// Domain Layer

import { TariffRate, CreateTariffRateInput, UpdateTariffRateInput } from '../entities/tariff-rate.entity';

export interface ITariffRateRepository {
  // Crear
  create(input: CreateTariffRateInput): Promise<TariffRate>;

  // Leer
  findById(id: string): Promise<TariffRate | null>;
  findAll(filters?: { cargoType?: string; zone?: number; estado?: 'activo' | 'inactivo' }): Promise<
    TariffRate[]
  >;

  // Encontrar tarifa vigente (en la fecha actual o especificada)
  findEffective(cargoType: string, zone: number, date?: Date): Promise<TariffRate | null>;

  // Encontrar todas las versiones de una tarifa
  findVersions(cargoType: string, zone: number): Promise<TariffRate[]>;

  // Actualizar (crea una nueva versión, marca la anterior como inactiva)
  update(id: string, input: UpdateTariffRateInput): Promise<TariffRate>;

  // Soft delete (marcar como inactivo)
  deactivate(id: string): Promise<void>;

  // Existencia
  existsByCargoAndZone(cargoType: string, zone: number): Promise<boolean>;
}
