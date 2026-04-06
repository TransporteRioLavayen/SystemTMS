// =============================================================================
// GET PLANILLA BY ID USE CASE - BACKEND
// =============================================================================

import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class GetPlanillaByIdUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string): Promise<Planilla> {
    const planilla = await this.repository.findById(id);
    if (!planilla) {
      throw new Error('Planilla no encontrada');
    }
    return planilla;
  }
}
