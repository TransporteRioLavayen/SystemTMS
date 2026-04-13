// =============================================================================
// USE CASE: Get All Tariff Versions
// =============================================================================
// Application Layer
// Retorna todas las versiones de una tarifa (para el historial de auditoría)

import { TariffRate } from '../../../domain/entities/tariff-rate.entity';
import { ITariffRateRepository } from '../../../domain/repositories/tariff-rate.repository.interface';

export class GetTariffVersionsUseCase {
  constructor(private tariffRepository: ITariffRateRepository) {}

  async execute(cargoType: string, zone: number): Promise<TariffRate[]> {
    return this.tariffRepository.findVersions(cargoType, zone);
  }
}
