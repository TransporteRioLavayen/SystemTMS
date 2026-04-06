// =============================================================================
// USE CASE: CREAR CHOFER
// =============================================================================
// Application Layer - Caso de uso para crear un chofer

import { Chofer } from '../../domain/entities/chofer.entity';
import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';
import { CreateChoferDTO } from '../dto/create-chofer.dto';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateChoferUseCase {
  constructor(private repository: IChoferRepository) {}

  async execute(data: CreateChoferDTO): Promise<Chofer> {
    // Validar que el DNI no exista
    const exists = await this.repository.existsByDni(data.dni);
    if (exists) {
      throw new ValidationError('Ya existe un chofer con este DNI');
    }

    return this.repository.create(data);
  }
}