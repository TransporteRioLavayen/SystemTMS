// =============================================================================
// USE CASE: ACTUALIZAR DEPOSITO
// =============================================================================
// Application Layer - Caso de uso para actualizar un depósito

import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';
import { UpdateDepositoDTO } from '../dto/update-deposito.dto';
import { toDepositoResponseDTO, DepositoResponseDTO } from '../dto/deposito-response.dto';
import { NotFoundError, ValidationError } from './get-deposito-by-id.use-case';

export class UpdateDepositoUseCase {
  constructor(private readonly repository: IDepositoRepository) {}

  async execute(id: string, data: UpdateDepositoDTO): Promise<DepositoResponseDTO> {
    // Verificar que el depósito existe
    const existe = await this.repository.findById(id);
    if (!existe) {
      throw new NotFoundError(`Depósito con ID ${id} no encontrado`);
    }

    // Validación de negocio: si se cambia el nombre, verificar que no exista otro
    if (data.nombre && data.nombre !== existe.nombre) {
      const nombreDuplicado = await this.repository.existsByNombre(data.nombre);
      if (nombreDuplicado) {
        throw new ValidationError('Ya existe un depósito con ese nombre');
      }
    }

    // Actualizar el depósito
    const actualizado = await this.repository.update(id, data);
    
    return toDepositoResponseDTO(actualizado);
  }
}