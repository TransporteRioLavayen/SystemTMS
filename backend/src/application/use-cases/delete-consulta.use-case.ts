// =============================================================================
// USE CASE: DELETE CONSULTA
// =============================================================================
// Application Layer - Caso de uso para eliminar una consulta

import { IConsultaRepository } from '../../../domain/repositories/consulta.repository.interface';
import { logger } from '../../infrastructure/logging/logger';

export class DeleteConsultaUseCase {
  constructor(private consultaRepository: IConsultaRepository) {}

  async execute(id: string) {
    logger.info('[DeleteConsulta] Eliminando consulta: %s', id);
    return await this.consultaRepository.delete(id);
  }
}
