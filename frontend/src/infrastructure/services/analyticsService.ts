// =============================================================================
// SERVICE: ANALYTICS
// =============================================================================
// Infrastructure Layer - Servicio para consumir los endpoints de analíticas

import { apiClient } from '../api/client';

// =============================================================================
// DASHBOARD PRINCIPAL
// =============================================================================

export interface DashboardStats {
  remitosHoy: number;
  remitosAyer: number;
  variacionRemitos: number;
  enCamino: number;
  entregadosMes: number;
  rechazadosMes: number;
  tasaEntrega: number;
  tasaRechazo: number;
  last30DaysTrend: Array<{ date: string; count: number }>;
  distribucionEstado: Array<{ estado: string; count: number }>;
  valorDeclaradoMes: number;
  bultosEntregadosMes: number;
  promedioBultosPorRemito: number;
}

// =============================================================================
// REMITOS
// =============================================================================

export interface RemitosAnalytics {
  totalRemitos: number;
  remitosPorEstado: Array<{ estado: string; count: number }>;
  remitosPorDia: Array<{ date: string; count: number }>;
  valorDeclaradoTotal: number;
  valorPromedioPorRemito: number;
  bultosTotal: number;
  promedioBultos: number;
  tiempoPromedioEntrega: number;
  tasaEntrega: number;
  tasaRechazo: number;
  tasaEnCurso: number;
}

// =============================================================================
// FLOTA
// =============================================================================

export interface FlotaAnalytics {
  totalUnidades: number;
  disponibles: number;
  enRuta: number;
  mantenimiento: number;
  fueraDeServicio: number;
  utilizacionPorcentaje: number;
  porTipo: Array<{ tipo: string; count: number }>;
  porTipoServicio: Array<{ tipo: string; count: number }>;
  tendenciaUtilizacion: Array<{ date: string; utilization: number }>;
}

// =============================================================================
// HOJAS DE RUTA
// =============================================================================

export interface HojasRutaAnalytics {
  totalHojas: number;
  hojasActivas: number;
  hojasCompletadas: number;
  porEstado: Array<{ estado: string; count: number }>;
  kmTotales: number;
  kmPromedioPorHoja: number;
  porTipoFlota: Array<{ tipo: string; count: number }>;
  porTipoServicio: Array<{ tipo: string; count: number }>;
  porZona: Array<{ zona: string; count: number }>;
  promedioCargasPorHoja: number;
  cargasEntregadas: number;
  cargasRechazadas: number;
}

// =============================================================================
// CHOFERES
// =============================================================================

export interface ChoferesAnalytics {
  totalChoferes: number;
  disponibles: number;
  enRuta: number;
  inactivos: number;
  licenciasPorVencer: Array<{
    id: string;
    nombre: string;
    dni: string;
    vencimiento: string;
    diasRestantes: number;
  }>;
  alertasactivas: number;
}

// =============================================================================
// TERCEROS
// =============================================================================

export interface TercerosAnalytics {
  totalTerceros: number;
  activos: number;
  inactivos: number;
  porTipoServicio: Array<{ tipo: string; count: number }>;
  porTipoUnidad: Array<{ tipo: string; count: number }>;
  segurosPorVencer: any[];
  vtvPorVencer: any[];
  licenciasPorVencer: any[];
  alertasActivas: number;
}

// =============================================================================
// DEPOSITOS
// =============================================================================

export interface DepositosAnalytics {
  totalDepositos: number;
  activos: number;
  porZona: Array<{ zona: number; count: number; capacidadTotal: number }>;
  detalle: Array<{
    id: string;
    nombre: string;
    zona: number;
    capacidad: number;
    cargasActivas: number;
    porcentajeOcupacion: number;
  }>;
}

// =============================================================================
// CONSULTAS
// =============================================================================

export interface ConsultasAnalytics {
  totalConsultas: number;
  consultasMesActual: number;
  consultasMesAnterior: number;
  variacionPorcentual: number;
  pendientes: number;
  enProceso: number;
  respondidas: number;
  cerradas: number;
  porTipo: Array<{ tipo: string; count: number }>;
  tiempoPromedioRespuesta: number;
}

// =============================================================================
// COTIZACIONES
// =============================================================================

export interface CotizacionesAnalytics {
  totalCotizaciones: number;
  cotizacionesMes: number;
  valorTotal: number;
  valorPromedio: number;
  porTipoCarga: Array<{ tipo: string; count: number; valorTotal: number }>;
  porZona: Array<{ zona: number; count: number; valorTotal: number }>;
  conEntregaDomicilio: number;
  sinEntregaDomicilio: number;
}

// =============================================================================
// PLANILLAS
// =============================================================================

export interface PlanillasAnalytics {
  totalPlanillas: number;
  planillasActivas: number;
  porEstado: Array<{ estado: string; count: number }>;
  kmSalidaTotal: number;
  kmLlegadaTotal: number;
  kmRecorridos: number;
  kmPromedioPorViaje: number;
  porSucursalOrigen: Array<{ sucursal: string; count: number }>;
  porSucursalDestino: Array<{ sucursal: string; count: number }>;
}

// =============================================================================
// ALERTAS
// =============================================================================

export interface AlertaMantenimiento {
  id: string;
  tipo: 'licencia' | 'vtv' | 'seguro' | 'seguro_tercero' | 'vtv_tercero';
  entidad: 'chofer' | 'unidad' | 'tercero';
  descripcion: string;
  fechaVencimiento: string;
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja';
}

// =============================================================================
// TENDENCIA
// =============================================================================

export interface TendenciaAnalytics {
  periodo: string;
  data: Array<{
    date: string;
    remitos: number;
    entregados: number;
    rechazados: number;
    valor: number;
  }>;
}

// =============================================================================
// RESUMEN EJECUTIVO
// =============================================================================

export interface ResumenEjecutivo {
  remitosHoy: number;
  hojasHoy: number;
  remitosEsteMes: number;
  valorDeclaradoEsteMes: number;
  entregasExitosas: number;
  rechazos: number;
  tasaEntrega: number;
  flotaTotal: number;
  flotaDisponible: number;
  flotaEnRuta: number;
  flotaEnMantenimiento: number;
  utilizacionFlota: number;
  choferesDisponibles: number;
  alertasLicencias: number;
  tercerosActivos: number;
  alertasVencimientos: number;
  consultasPendientes: number;
  variacionRemitos: number;
  variacionValor: number;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class AnalyticsService {
  
  /**
   * Dashboard principal
   */
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/dashboard?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Resumen ejecutivo
   */
  async getResumen(): Promise<ResumenEjecutivo> {
    const response = await apiClient.get('/analytics/resumen');
    return response.data.data;
  }

  /**
   * Remitos
   */
  async getRemitosAnalytics(startDate?: string, endDate?: string): Promise<RemitosAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/remitos?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Flota
   */
  async getFlotaAnalytics(): Promise<FlotaAnalytics> {
    const response = await apiClient.get('/analytics/flota');
    return response.data.data;
  }

  /**
   * Hojas de ruta
   */
  async getHojasRutaAnalytics(startDate?: string, endDate?: string): Promise<HojasRutaAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/hojas-ruta?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Choferes
   */
  async getChoferesAnalytics(): Promise<ChoferesAnalytics> {
    const response = await apiClient.get('/analytics/choferes');
    return response.data.data;
  }

  /**
   * Terceros
   */
  async getTercerosAnalytics(): Promise<TercerosAnalytics> {
    const response = await apiClient.get('/analytics/terceros');
    return response.data.data;
  }

  /**
   * Depositos
   */
  async getDepositosAnalytics(): Promise<DepositosAnalytics> {
    const response = await apiClient.get('/analytics/depositos');
    return response.data.data;
  }

  /**
   * Consultas
   */
  async getConsultasAnalytics(startDate?: string, endDate?: string): Promise<ConsultasAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/consultas?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Cotizaciones
   */
  async getCotizacionesAnalytics(startDate?: string, endDate?: string): Promise<CotizacionesAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/cotizaciones?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Planillas
   */
  async getPlanillasAnalytics(startDate?: string, endDate?: string): Promise<PlanillasAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/planillas?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Tendencias
   */
  async getTendenciaAnalytics(startDate?: string, endDate?: string): Promise<TendenciaAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/tendencias?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Alertas
   */
  async getAlertas(): Promise<AlertaMantenimiento[]> {
    const response = await apiClient.get('/analytics/alertas');
    return response.data.data;
  }
}

export const analyticsService = new AnalyticsService();