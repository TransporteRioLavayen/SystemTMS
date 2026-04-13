// =============================================================================
// USE CASE: LIST CONSULTAS
// =============================================================================
// Application Layer - Caso de uso para listar consultas con paginación

import { IConsultaRepository } from '../../../domain/repositories/consulta.repository.interface';
import { logger } from '../../infrastructure/logging/logger';

export class ListConsultasUseCase {
  constructor(private consultaRepository: IConsultaRepository) {}

  async execute(options: { offset: number; limit: number; estado?: string }) {
    logger.info('[ListConsultas] Listando consultas: offset=%d, limit=%d, estado=%s', options.offset, options.limit, options.estado || 'todas');
    return await this.consultaRepository.findAllPaginated({
      offset: options.offset,
      limit: options.limit,
      estado: options.estado,
    });
  }
}
