// =============================================================================
// DELETE PLANILLA USE CASE - BACKEND
// =============================================================================

import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class DeletePlanillaUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Planilla no encontrada');
    }

    await this.repository.delete(id);
  }
}
