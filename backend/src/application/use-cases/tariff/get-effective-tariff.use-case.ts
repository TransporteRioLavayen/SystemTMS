// =============================================================================
// USE CASE: Get Effective Tariff (Tarifa vigente)
// =============================================================================
// Application Layer
// Retorna la tarifa que está vigente en la fecha especificada (o hoy)

import { TariffRate } from '../../../domain/entities/tariff-rate.entity';
import { ITariffRateRepository } from '../../../domain/repositories/tariff-rate.repository.interface';

export class GetEffectiveTariffUseCase {
  constructor(private tariffRepository: ITariffRateRepository) {}

  async execute(cargoType: string, zone: number, date?: Date): Promise<TariffRate | null> {
    const targetDate = date || new Date();
    return this.tariffRepository.findEffective(cargoType, zone, targetDate);
  }
}
