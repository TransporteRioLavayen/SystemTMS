// =============================================================================
// USE CASE: OBTENER ANALÍTICAS DE FLOTA
// =============================================================================

import { FlotaAnalytics } from '../../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../../domain/repositories/analytics.repository.interface';

export class GetFlotaAnalyticsUseCase {
  constructor(private repository: IAnalyticsRepository) {}

  async execute(): Promise<FlotaAnalytics> {
    return this.repository.getFlotaAnalytics();
  }
}
