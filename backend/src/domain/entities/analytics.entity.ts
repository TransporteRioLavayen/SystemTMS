/**
 * Analytical Entities
 */

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
  utilizacion: number; // Porcentaje (0.0 to 1.0)
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
