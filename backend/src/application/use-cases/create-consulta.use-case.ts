// =============================================================================
// USE CASE: CREATE CONSULTA
// =============================================================================
// Application Layer - Caso de uso para crear una consulta

import { IConsultaRepository } from '../../../domain/repositories/consulta.repository.interface';
import { CreateConsultaInput } from '../../../domain/entities/consulta.entity';
import { logger } from '../../infrastructure/logging/logger';

export class CreateConsultaUseCase {
  constructor(private consultaRepository: IConsultaRepository) {}

  async execute(data: CreateConsultaInput) {
    logger.info('[CreateConsulta] Creando consulta: %s (%s)', data.nombre, data.email);
    return await this.consultaRepository.create(data);
  }
}
