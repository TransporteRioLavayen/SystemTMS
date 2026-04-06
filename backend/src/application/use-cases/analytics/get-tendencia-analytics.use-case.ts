// =============================================================================
// USE CASE: OBTENER ANALÍTICAS DE TENDENCIAS
// =============================================================================

import { TendenciaAnalytics } from '../../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../../domain/repositories/analytics.repository.interface';

export class GetTendenciaAnalyticsUseCase {
  constructor(private repository: IAnalyticsRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<TendenciaAnalytics> {
    return this.repository.getTendenciaAnalytics(startDate, endDate);
  }
}
