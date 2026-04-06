// =============================================================================
// USE CASE: OBTENER DEPOSITO POR ID
// =============================================================================
// Application Layer - Caso de uso para obtener un depósito específico

import { Deposito } from '../../domain/entities/deposito.entity';
import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';
import { toDepositoResponseDTO, DepositoResponseDTO } from '../dto/deposito-response.dto';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GetDepositoByIdUseCase {
  constructor(private readonly repository: IDepositoRepository) {}

  async execute(id: string): Promise<DepositoResponseDTO> {
    const deposito = await this.repository.findById(id);
    
    if (!deposito) {
      throw new NotFoundError(`Depósito con ID ${id} no encontrado`);
    }
    
    return toDepositoResponseDTO(deposito);
  }
}