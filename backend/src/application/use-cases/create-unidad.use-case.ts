// =============================================================================
// USE CASE: CREAR UNIDAD
// =============================================================================
// Application Layer - Caso de uso para crear una unidad

import { Unidad } from '../../domain/entities/unidad.entity';
import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';
import { CreateUnidadDTO } from '../dto/create-unidad.dto';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateUnidadUseCase {
  constructor(private repository: IUnidadRepository) {}

  async execute(data: CreateUnidadDTO): Promise<Unidad> {
    // Validar que la patente no exista
    const exists = await this.repository.existsByPatente(data.patente);
    if (exists) {
      throw new ValidationError('Ya existe una unidad con esta patente');
    }

    return this.repository.create(data);
  }
}