// =============================================================================
// USE CASE: CREAR TERCERO
// =============================================================================
// Application Layer - Caso de uso para crear un tercero

import { Tercero } from '../../domain/entities/tercero.entity';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';
import { CreateTerceroDTO } from '../dto/create-tercero.dto';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateTerceroUseCase {
  constructor(private repository: ITerceroRepository) {}

  async execute(data: CreateTerceroDTO): Promise<Tercero> {
    // Validar que la razón social no exista
    const exists = await this.repository.existsByNombre(data.razonSocial);
    if (exists) {
      throw new ValidationError('Ya existe un tercero con esta razón social');
    }

    return this.repository.create(data);
  }
}