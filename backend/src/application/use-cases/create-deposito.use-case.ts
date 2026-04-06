// =============================================================================
// USE CASE: CREAR DEPOSITO
// =============================================================================
// Application Layer - Caso de uso para crear un nuevo depósito

import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';
import { CreateDepositoInput } from '../../domain/entities/deposito.entity';
import { CreateDepositoDTO } from '../dto/create-deposito.dto';
import { toDepositoResponseDTO, DepositoResponseDTO } from '../dto/deposito-response.dto';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateDepositoUseCase {
  constructor(private readonly repository: IDepositoRepository) {}

  async execute(data: CreateDepositoDTO): Promise<DepositoResponseDTO> {
    // Validación de negocio: verificar si ya existe un depósito con el mismo nombre
    const existe = await this.repository.existsByNombre(data.nombre);
    if (existe) {
      throw new ValidationError('Ya existe un depósito con ese nombre');
    }

    // Crear el depósito a través del repository
    const nuevoDeposito = await this.repository.create(data);
    
    return toDepositoResponseDTO(nuevoDeposito);
  }
}