// =============================================================================
// USE CASE: ELIMINAR DEPOSITO
// =============================================================================
// Application Layer - Caso de uso para eliminar (soft delete) un depósito

import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';
import { NotFoundError } from './get-deposito-by-id.use-case';

export class DeleteDepositoUseCase {
  constructor(private readonly repository: IDepositoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el depósito existe
    const existe = await this.repository.findById(id);
    if (!existe) {
      throw new NotFoundError(`Depósito con ID ${id} no encontrado`);
    }

    // Soft delete: cambiar estado a inactivo en lugar de eliminar
    await this.repository.delete(id);
  }
}