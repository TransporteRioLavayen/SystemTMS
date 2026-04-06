// =============================================================================
// SERVICE: ANALYTICS
// =============================================================================
// Infrastructure Layer - Servicio para consumir los endpoints de analíticas

import { apiClient } from '../api/client';

export interface DashboardStats {
  remitosHoy: number;
  enCamino: number;
  entregadosMes: number;
  tasaEntrega: number;
  last30DaysTrend: Array<{ date: string; count: number }>;
  distribucionEstado: Array<{ estado: string; count: number }>;
}

export interface RemitosAnalytics {
  porEstado: Array<{ estado: string; count: number }>;
  totalValorDeclarado: number;
  promedioBultos: number;
  volumenPorDia: Array<{ date: string; count: number }>;
}

export interface FlotaAnalytics {
  utilizacion: number;
  enServicio: number;
  mantenimiento: number;
  disponibles: number;
  tiposServicio: Array<{ tipo: string; count: number }>;
}

export interface TendenciaAnalytics {
  periodo: string;
  data: Array<{
    date: string;
    remitos: number;
    entregados: number;
    rechazados: number;
  }>;
}

export interface AlertaMantenimiento {
  id: string;
  tipo: 'licencia' | 'vtv' | 'seguro';
  descripcion: string;
  fechaVencimiento: string;
  prioridad: 'alta' | 'media' | 'baja';
}

export class AnalyticsService {
  
  /**
   * Obtiene estadísticas del dashboard para un rango de fechas
   */
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/dashboard?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtiene analíticas detalladas de remitos
   */
  async getRemitosAnalytics(startDate?: string, endDate?: string): Promise<RemitosAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/remitos?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtiene analíticas de flota
   */
  async getFlotaAnalytics(): Promise<FlotaAnalytics> {
    const response = await apiClient.get('/analytics/flota');
    return response.data.data;
  }

  /**
   * Obtiene tendencias de envíos
   */
  async getTendenciaAnalytics(startDate?: string, endDate?: string): Promise<TendenciaAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/tendencias?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtiene alertas de mantenimiento
   */
  async getAlertas(): Promise<AlertaMantenimiento[]> {
    const response = await apiClient.get('/analytics/alertas');
    return response.data.data;
  }
}

export const analyticsService = new AnalyticsService();
