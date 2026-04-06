// =============================================================================
// REPOSITORY INTERFACE: ANALYTICS
// =============================================================================
// Domain Layer - Interfaz del repositorio para analíticas

import { 
  DashboardStats, 
  RemitosAnalytics, 
  FlotaAnalytics, 
  TendenciaAnalytics, 
  AlertaMantenimiento 
} from '../entities/analytics.entity';

export interface IAnalyticsRepository {
  getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats>;
  getRemitosAnalytics(startDate: Date, endDate: Date): Promise<RemitosAnalytics>;
  getFlotaAnalytics(): Promise<FlotaAnalytics>;
  getTendenciaAnalytics(startDate: Date, endDate: Date): Promise<TendenciaAnalytics>;
  getAlertasMantenimiento(): Promise<AlertaMantenimiento[]>;
}
