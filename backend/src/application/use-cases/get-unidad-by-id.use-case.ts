// =============================================================================
// USE CASE: OBTENER UNIDAD POR ID
// =============================================================================
// Application Layer - Caso de uso para obtener una unidad por su ID

import { Unidad } from '../../domain/entities/unidad.entity';
import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';

export class GetUnidadByIdUseCase {
  constructor(private repository: IUnidadRepository) {}

  async execute(id: string): Promise<Unidad> {
    const unidad = await this.repository.findById(id);
    if (!unidad) {
      throw new Error('Unidad no encontrada');
    }
    return unidad;
  }
}