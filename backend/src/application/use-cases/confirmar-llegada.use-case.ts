// =============================================================================
// CONFIRMAR LLEGADA USE CASE - BACKEND
// =============================================================================
// Transición: viaje -> control
// Estado tracking: En casa central

import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class ConfirmarLlegadaUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string, kmLlegada: number): Promise<Planilla> {
    const planilla = await this.repository.findById(id);
    if (!planilla) {
      throw new Error('Planilla no encontrada');
    }

    if (planilla.estado !== 'viaje') {
      throw new Error('La planilla debe estar en estado viaje para confirmar la llegada');
    }

    const updated = await this.repository.update(id, {
      estado: 'control',
      kmLlegada,
    });

    // Registrar evento de tracking: En casa central
    await this.repository.registrarTrackingLlegada(id);

    return updated;
  }
}
