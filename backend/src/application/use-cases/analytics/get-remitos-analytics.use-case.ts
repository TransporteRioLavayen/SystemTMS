// =============================================================================
// USE CASE: OBTENER ANALÍTICAS DE REMITOS
// =============================================================================

import { RemitosAnalytics } from '../../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../../domain/repositories/analytics.repository.interface';

export class GetRemitosAnalyticsUseCase {
  constructor(private repository: IAnalyticsRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<RemitosAnalytics> {
    return this.repository.getRemitosAnalytics(startDate, endDate);
  }
}
