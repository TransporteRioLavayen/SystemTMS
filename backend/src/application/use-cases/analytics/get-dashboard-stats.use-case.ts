// =============================================================================
// USE CASE: OBTENER ESTADÍSTICAS DEL DASHBOARD
// =============================================================================

import { DashboardStats } from '../../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../../domain/repositories/analytics.repository.interface';

export class GetDashboardStatsUseCase {
  constructor(private repository: IAnalyticsRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<DashboardStats> {
    return this.repository.getDashboardStats(startDate, endDate);
  }
}
