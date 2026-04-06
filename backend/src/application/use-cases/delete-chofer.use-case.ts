// =============================================================================
// USE CASE: ELIMINAR CHOFER
// =============================================================================
// Application Layer - Caso de uso para eliminar un chofer (hard delete)

import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';

export class DeleteChoferUseCase {
  constructor(private repository: IChoferRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Chofer no encontrado');
    }

    return this.repository.delete(id);
  }
}