// =============================================================================
// CONFIRMAR VIAJE USE CASE - BACKEND
// =============================================================================
// Transición: borrador -> viaje
// Genera códigos de seguimiento (TRK-XXXXX) para cada remito

import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class ConfirmarViajeUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string, kmSalida: number): Promise<Planilla> {
    const planilla = await this.repository.findById(id);
    if (!planilla) {
      throw new Error('Planilla no encontrada');
    }

    if (planilla.estado !== 'borrador') {
      throw new Error('La planilla debe estar en estado borrador para confirmar el viaje');
    }

    // 1. Actualizar la planilla a estado 'viaje' con km de salida
    const updated = await this.repository.update(id, {
      estado: 'viaje',
      kmSalida,
    });

    // 2. Generar códigos de seguimiento (TRK-XXXXX) para cada remito
    await this.repository.generarSeguimientoRemitos(id);

    // 3. Devolver la planilla con los remitos actualizados (ahora con seguimiento)
    const result = await this.repository.findById(id);
    if (!result) {
      throw new Error('Error al recuperar la planilla actualizada');
    }
    return result;
  }
}
