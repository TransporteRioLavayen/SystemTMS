// =============================================================================
// USE CASE: ACTUALIZAR UNIDAD
// =============================================================================
// Application Layer - Caso de uso para actualizar una unidad

import { Unidad } from '../../domain/entities/unidad.entity';
import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';
import { UpdateUnidadDTO } from '../dto/update-unidad.dto';
import { ValidationError } from './create-unidad.use-case';

export { ValidationError };

export class UpdateUnidadUseCase {
  constructor(private repository: IUnidadRepository) {}

  async execute(id: string, data: UpdateUnidadDTO): Promise<Unidad> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Unidad no encontrada');
    }

    // Si se cambia la patente, verificar que no exista otra
    if (data.patente && data.patente !== existing.patente) {
      const exists = await this.repository.existsByPatente(data.patente);
      if (exists) {
        throw new ValidationError('Ya existe una unidad con esta patente');
      }
    }

    return this.repository.update(id, data);
  }
}