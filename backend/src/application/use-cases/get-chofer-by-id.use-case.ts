// =============================================================================
// USE CASE: OBTENER CHOFER POR ID
// =============================================================================
// Application Layer - Caso de uso para obtener un chofer por su ID

import { Chofer } from '../../domain/entities/chofer.entity';
import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';

export class GetChoferByIdUseCase {
  constructor(private repository: IChoferRepository) {}

  async execute(id: string): Promise<Chofer> {
    const chofer = await this.repository.findById(id);
    if (!chofer) {
      throw new Error('Chofer no encontrado');
    }
    return chofer;
  }
}