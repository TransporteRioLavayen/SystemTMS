// =============================================================================
// USE CASE: ELIMINAR UNIDAD
// =============================================================================
// Application Layer - Caso de uso para eliminar una unidad (soft delete)

import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';

export class DeleteUnidadUseCase {
  constructor(private repository: IUnidadRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Unidad no encontrada');
    }

    return this.repository.delete(id);
  }
}