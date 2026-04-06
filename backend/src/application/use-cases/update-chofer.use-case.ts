// =============================================================================
// USE CASE: ACTUALIZAR CHOFER
// =============================================================================
// Application Layer - Caso de uso para actualizar un chofer

import { Chofer } from '../../domain/entities/chofer.entity';
import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';
import { UpdateChoferDTO } from '../dto/update-chofer.dto';
import { ValidationError } from './create-chofer.use-case';

export class UpdateChoferUseCase {
  constructor(private repository: IChoferRepository) {}

  async execute(id: string, data: UpdateChoferDTO): Promise<Chofer> {
    // Verificar que existe
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Chofer no encontrado');
    }

    // Si se cambia el DNI, verificar que no exista otro
    if (data.dni && data.dni !== existing.dni) {
      const exists = await this.repository.existsByDni(data.dni);
      if (exists) {
        throw new ValidationError('Ya existe un chofer con este DNI');
      }
    }

    return this.repository.update(id, data);
  }
}