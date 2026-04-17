// =============================================================================
// REPOSITORY INTERFACE: ANALYTICS
// =============================================================================
// Domain Layer - Interfaz del repositorio para analíticas

import { 
  DashboardStats, 
  RemitosAnalytics, 
  FlotaAnalytics, 
  TendenciaAnalytics, 
  AlertaMantenimiento,
  HojasRutaAnalytics,
  ChoferesAnalytics,
  TercerosAnalytics,
  DepositosAnalytics,
  ConsultasAnalytics,
  CotizacionesAnalytics,
  PlanillasAnalytics,
  ResumenEjecutivo
} from '../entities/analytics.entity';

export interface IAnalyticsRepository {
  // Dashboard principal
  getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats>;
  
  // Remitos
  getRemitosAnalytics(startDate: Date, endDate: Date): Promise<RemitosAnalytics>;
  
  // Flota (unidades propias)
  getFlotaAnalytics(): Promise<FlotaAnalytics>;
  
  // Hojas de ruta
  getHojasRutaAnalytics(startDate: Date, endDate: Date): Promise<HojasRutaAnalytics>;
  
  // Choferes
  getChoferesAnalytics(): Promise<ChoferesAnalytics>;
  
  // Terceros (flota externa)
  getTercerosAnalytics(): Promise<TercerosAnalytics>;
  
  // Depósitos
  getDepositosAnalytics(): Promise<DepositosAnalytics>;
  
  // Consultas
  getConsultasAnalytics(startDate: Date, endDate: Date): Promise<ConsultasAnalytics>;
  
  // Cotizaciones
  getCotizacionesAnalytics(startDate: Date, endDate: Date): Promise<CotizacionesAnalytics>;
  
  // Planillas
  getPlanillasAnalytics(startDate: Date, endDate: Date): Promise<PlanillasAnalytics>;
  
  // Alertas de mantenimiento
  getAlertasMantenimiento(): Promise<AlertaMantenimiento[]>;
  
  // Tendencias
  getTendenciaAnalytics(startDate: Date, endDate: Date): Promise<TendenciaAnalytics>;
  
  // Resumen ejecutivo
  getResumenEjecutivo(): Promise<ResumenEjecutivo>;
}