// =============================================================================
// USE CASE: OBTENER ALERTAS DE MANTENIMIENTO
// =============================================================================

import { AlertaMantenimiento } from '../../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../../domain/repositories/analytics.repository.interface';

export class GetAlertasAnalyticsUseCase {
  constructor(private repository: IAnalyticsRepository) {}

  async execute(): Promise<AlertaMantenimiento[]> {
    return this.repository.getAlertasMantenimiento();
  }
}
