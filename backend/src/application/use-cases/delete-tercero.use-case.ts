// =============================================================================
// USE CASE: ELIMINAR TERCERO
// =============================================================================
// Application Layer - Caso de uso para eliminar un tercero (soft delete)

import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';

export class DeleteTerceroUseCase {
  constructor(private repository: ITerceroRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Tercero no encontrado');
    }

    return this.repository.delete(id);
  }
}