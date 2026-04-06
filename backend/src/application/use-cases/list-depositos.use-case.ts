// =============================================================================
// USE CASE: LISTAR DEPOSITOS
// =============================================================================
// Application Layer - Caso de uso para listar todos los depósitos

import { Deposito } from '../../domain/entities/deposito.entity';
import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';
import { toDepositoResponseDTO, DepositoResponseDTO } from '../dto/deposito-response.dto';

export class ListDepositosUseCase {
  constructor(private readonly repository: IDepositoRepository) {}

  async execute(includeInactive: boolean = false): Promise<DepositoResponseDTO[]> {
    const depositos = await this.repository.findAll(includeInactive);
    return depositos.map(toDepositoResponseDTO);
  }

  async executePaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: DepositoResponseDTO[]; total: number }> {
    const result = await this.repository.findAllPaginated(options);
    return {
      data: result.data.map(toDepositoResponseDTO),
      total: result.total,
    };
  }
}