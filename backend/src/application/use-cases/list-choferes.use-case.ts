// =============================================================================
// USE CASE: LISTAR CHOFERES
// =============================================================================
// Application Layer - Caso de uso para listar choferes

import { Chofer } from '../../domain/entities/chofer.entity';
import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';

export class ListChoferesUseCase {
  constructor(private repository: IChoferRepository) {}

  async execute(includeInactive: boolean = false): Promise<Chofer[]> {
    return this.repository.findAll(includeInactive);
  }

  async executePaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Chofer[]; total: number }> {
    return this.repository.findAllPaginated(options);
  }
}