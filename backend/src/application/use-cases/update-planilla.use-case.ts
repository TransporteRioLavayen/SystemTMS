// =============================================================================
// UPDATE PLANILLA USE CASE - BACKEND
// =============================================================================

import { UpdatePlanillaDto } from '../dto/update-planilla.dto';
import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class UpdatePlanillaUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string, dto: UpdatePlanillaDto): Promise<Planilla> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Planilla no encontrada');
    }

    const updated = await this.repository.update(id, dto);
    return updated;
  }
}
