// =============================================================================
// USE CASE: OBTENER TERCERO POR ID
// =============================================================================
// Application Layer - Caso de uso para obtener un tercero por su ID

import { Tercero } from '../../domain/entities/tercero.entity';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';

export class GetTerceroByIdUseCase {
  constructor(private repository: ITerceroRepository) {}

  async execute(id: string): Promise<Tercero> {
    const tercero = await this.repository.findById(id);
    if (!tercero) {
      throw new Error('Tercero no encontrado');
    }
    return tercero;
  }
}