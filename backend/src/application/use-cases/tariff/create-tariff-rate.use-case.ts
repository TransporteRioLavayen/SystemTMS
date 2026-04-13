// =============================================================================
// USE CASE: Create Tariff Rate (Nueva versión)
// =============================================================================
// Application Layer
// Nota: Al crear una tarifa nueva, automáticamente crea version = 1

import {
  TariffRate,
  CreateTariffRateInput,
  createTariffRateEntity,
} from '../../../domain/entities/tariff-rate.entity';
import { ITariffRateRepository } from '../../../domain/repositories/tariff-rate.repository.interface';

export class CreateTariffRateUseCase {
  constructor(private tariffRepository: ITariffRateRepository) {}

  async execute(input: CreateTariffRateInput): Promise<TariffRate> {
    // Validar rango de fechas
    if (input.validFrom >= input.validTo) {
      throw new Error('validFrom must be before validTo');
    }

    // Crear la tarifa con version=1
    const tariff = createTariffRateEntity({
      id: crypto.randomUUID ? crypto.randomUUID() : `tariff-${Date.now()}`,
      ...input,
    });

    return this.tariffRepository.create(tariff);
  }
}
