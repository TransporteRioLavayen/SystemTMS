// =============================================================================
// USE CASE: LISTAR UNIDADES
// =============================================================================
// Application Layer - Caso de uso para listar unidades

import { Unidad } from '../../domain/entities/unidad.entity';
import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';

export class ListUnidadesUseCase {
  constructor(private repository: IUnidadRepository) {}

  async execute(includeInactive: boolean = false): Promise<Unidad[]> {
    return this.repository.findAll(includeInactive);
  }

  async executePaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Unidad[]; total: number }> {
    return this.repository.findAllPaginated(options);
  }
}