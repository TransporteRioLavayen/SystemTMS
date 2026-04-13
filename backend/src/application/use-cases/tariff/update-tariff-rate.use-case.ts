// =============================================================================
// USE CASE: Update Tariff Rate (Crea nueva versión)
// =============================================================================
// Application Layer
// IMPORTANTE: Esta operación NO actualiza el registro existente.
// En su lugar, crea una NUEVA VERSION con version++,
// y marca la anterior como inactiva (soft delete).

import {
  TariffRate,
  UpdateTariffRateInput,
  createNextVersionTariffRate,
} from '../../../domain/entities/tariff-rate.entity';
import { ITariffRateRepository } from '../../../domain/repositories/tariff-rate.repository.interface';

export class UpdateTariffRateUseCase {
  constructor(private tariffRepository: ITariffRateRepository) {}

  async execute(id: string, input: UpdateTariffRateInput): Promise<TariffRate> {
    // Obtener la versión actual
    const currentTariff = await this.tariffRepository.findById(id);
    if (!currentTariff) {
      throw new Error(`Tariff with id ${id} not found`);
    }

    // Validar rango de fechas si cambia
    if (input.validFrom && input.validTo) {
      if (input.validFrom >= input.validTo) {
        throw new Error('validFrom must be before validTo');
      }
    }

    // Crear nueva versión
    const newTariff = createNextVersionTariffRate(currentTariff, {
      ...currentTariff,
      ...input,
    });

    // Guardar nueva versión
    const savedTariff = await this.tariffRepository.create(newTariff);

    // Deactivar la versión anterior
    await this.tariffRepository.deactivate(id);

    return savedTariff;
  }
}
