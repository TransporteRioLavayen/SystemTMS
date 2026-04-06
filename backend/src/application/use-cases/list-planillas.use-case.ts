// =============================================================================
// LIST PLANILLAS USE CASE - BACKEND
// =============================================================================

import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class ListPlanillasUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(estado?: string): Promise<Planilla[]> {
    if (estado) {
      return this.repository.findByEstado(estado);
    }
    return this.repository.findAll();
  }

  async executePaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: Planilla[]; total: number }> {
    return this.repository.findAllPaginated(options);
  }
}
