// =============================================================================
// USE CASE: UPDATE CONSULTA
// =============================================================================
// Application Layer - Caso de uso para actualizar una consulta

import { IConsultaRepository } from '@domain/repositories/consulta.repository.interface';
import { UpdateConsultaInput } from '@domain/entities/consulta.entity';
import { logger } from '../../infrastructure/logging/logger';

export class UpdateConsultaUseCase {
  constructor(private consultaRepository: IConsultaRepository) {}

  async execute(id: string, data: UpdateConsultaInput) {
    logger.info('[UpdateConsulta] Actualizando consulta: %s', id);
    return await this.consultaRepository.update(id, data);
  }
}
