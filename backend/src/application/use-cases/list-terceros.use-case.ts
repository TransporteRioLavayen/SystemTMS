// =============================================================================
// USE CASE: LISTAR TERCEROS
// =============================================================================
// Application Layer - Caso de uso para listar terceros

import { Tercero } from '../../domain/entities/tercero.entity';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';

export class ListTercerosUseCase {
  constructor(private repository: ITerceroRepository) {}

  async execute(includeInactive: boolean = false): Promise<Tercero[]> {
    return this.repository.findAll(includeInactive);
  }

  async executePaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Tercero[]; total: number }> {
    return this.repository.findAllPaginated(options);
  }
}