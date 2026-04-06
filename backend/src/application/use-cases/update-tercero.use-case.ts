// =============================================================================
// USE CASE: ACTUALIZAR TERCERO
// =============================================================================
// Application Layer - Caso de uso para actualizar un tercero

import { Tercero } from '../../domain/entities/tercero.entity';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';
import { UpdateTerceroDTO } from '../dto/update-tercero.dto';
import { ValidationError } from './create-tercero.use-case';

export class UpdateTerceroUseCase {
  constructor(private repository: ITerceroRepository) {}

  async execute(id: string, data: UpdateTerceroDTO): Promise<Tercero> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Tercero no encontrado');
    }

    // Si se cambia la razón social, verificar que no exista otra
    if (data.razonSocial && data.razonSocial !== existing.razonSocial) {
      const exists = await this.repository.existsByNombre(data.razonSocial);
      if (exists) {
        throw new ValidationError('Ya existe un tercero con esta razón social');
      }
    }

    return this.repository.update(id, data);
  }
}