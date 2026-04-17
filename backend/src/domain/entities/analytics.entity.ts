/**
 * ANALYTICS ENTITIES - Sistema completo de métricas para Transporte Río Lavayen
 * Basado en schema real de Supabase
 */

// =============================================================================
// DASHBOARD PRINCIPAL
// =============================================================================

export interface DashboardStats {
  // Remitos
  remitosHoy: number;
  remitosAyer: number;
  variacionRemitos: number; // % cambio vs ayer
  enCamino: number;
  entregadosMes: number;
  rechazadosMes: number;
  tasaEntrega: number;
  tasaRechazo: number;
  
  // Tendencia últimos 30 días
  last30DaysTrend: Array<{ date: string; count: number }>;
  
  // Distribución por estado
  distribucionEstado: Array<{ estado: string; count: number }>;
  
  // KPIs adicionales
  valorDeclaradoMes: number;
  bultosEntregadosMes: number;
  promedioBultosPorRemito: number;
}

// =============================================================================
// REMITOS ANALYTICS
// =============================================================================

export interface RemitosAnalytics {
  // Volumen
  totalRemitos: number;
  remitosPorEstado: Array<{ estado: string; count: number }>;
  remitosPorDia: Array<{ date: string; count: number }>;
  
  // Valor
  valorDeclaradoTotal: number;
  valorPromedioPorRemito: number;
  
  // Bultos
  bultosTotal: number;
  promedioBultos: number;
  
  // Tiempos promedio (días)
  tiempoPromedioEntrega: number;
  
  // Calidad
  tasaEntrega: number;
  tasaRechazo: number;
  tasaEnCurso: number;
}

// =============================================================================
// FLOTA ANALYTICS
// =============================================================================

export interface FlotaAnalytics {
  // Estados
  totalUnidades: number;
  disponibles: number;
  enRuta: number;
  mantenimiento: number;
  fueraDeServicio: number;
  
  // Utilización
  utilizacionPorcentaje: number;
  
  // Por tipo de unidad
  porTipo: Array<{ tipo: string; count: number }>;
  
  // Por tipo de servicio
  porTipoServicio: Array<{ tipo: string; count: number }>;
  
  // Tendencia últimos 30 días
  tendenciaUtilizacion: Array<{ date: string; utilization: number }>;
}

// =============================================================================
// HOJAS DE RUTA ANALYTICS
// =============================================================================

export interface HojasRutaAnalytics {
  // Volumen
  totalHojas: number;
  hojasActivas: number;
  hojasCompletadas: number;
  
  // Estados
  porEstado: Array<{ estado: string; count: number }>;
  
  // Kilometraje
  kmTotales: number;
  kmPromedioPorHoja: number;
  
  // Distribución por tipo
  porTipoFlota: Array<{ tipo: string; count: number }>;
  porTipoServicio: Array<{ tipo: string; count: number }>;
  
  // Distribución por zona (deposito origen)
  porZona: Array<{ zona: string; count: number }>;
  
  // Cargas
  promedioCargasPorHoja: number;
  cargasEntregadas: number;
  cargasRechazadas: number;
}

// =============================================================================
// CHOFERES ANALYTICS
// =============================================================================

export interface ChoferesAnalytics {
  // Estados
  totalChoferes: number;
  disponibles: number;
  enRuta: number;
  inactivos: number;
  
  // Licencias por vencer
  licenciasPorVencer: Array<{
    id: string;
    nombre: string;
    dni: string;
    vencimiento: string;
    diasRestantes: number;
  }>;
  
  // Alertas
  alertasactivas: number;
}

// =============================================================================
// TERCEROS (FLOTA EXTERNA) ANALYTICS
// =============================================================================

export interface TercerosAnalytics {
  // Estados
  totalTerceros: number;
  activos: number;
  inactivos: number;
  
  // Servicios
  porTipoServicio: Array<{ tipo: string; count: number }>;
  porTipoUnidad: Array<{ tipo: string; count: number }>;
  
  // Vencimientos próximos 30 días
  segurosPorVencer: Array<{
    id: string;
    razonSocial: string;
    patenteTractor: string;
    vencimiento: string;
    diasRestantes: number;
  }>;
  vtvPorVencer: Array<{
    id: string;
    razonSocial: string;
    patenteTractor: string;
    vencimiento: string;
    diasRestantes: number;
  }>;
  licenciasPorVencer: Array<{
    id: string;
    nombreChofer: string;
    dni: string;
    razonSocial: string;
    vencimiento: string;
    diasRestantes: number;
  }>;
  
  // Alertas
  alertasActivas: number;
}

// =============================================================================
// DEPOSITOS ANALYTICS
// =============================================================================

export interface DepositosAnalytics {
  totalDepositos: number;
  activos: number;
  
  // Por zona
  porZona: Array<{ zona: number; count: number; capacidadTotal: number }>;
  
  // Detalle por depósito
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
// CONSULTAS ANALYTICS
// =============================================================================

export interface ConsultasAnalytics {
  // Volumen
  totalConsultas: number;
  consultasMesActual: number;
  consultasMesAnterior: number;
  variacionPorcentual: number;
  
  // Estados
  pendientes: number;
  enProceso: number;
  respondidas: number;
  cerradas: number;
  
  // Por tipo
  porTipo: Array<{ tipo: string; count: number }>;
  
  // Tiempo promedio de respuesta (horas)
  tiempoPromedioRespuesta: number;
}

// =============================================================================
// COTIZACIONES ANALYTICS
// =============================================================================

export interface CotizacionesAnalytics {
  // Volumen
  totalCotizaciones: number;
  cotizacionesMes: number;
  
  // Valor
  valorTotal: number;
  valorPromedio: number;
  
  // Por tipo de carga
  porTipoCarga: Array<{ tipo: string; count: number; valorTotal: number }>;
  
  // Por zona
  porZona: Array<{ zona: number; count: number; valorTotal: number }>;
  
  // Con entrega a domicilio
  conEntregaDomicilio: number;
  sinEntregaDomicilio: number;
}

// =============================================================================
// PLANILLAS ANALYTICS
// =============================================================================

export interface PlanillasAnalytics {
  // Volumen
  totalPlanillas: number;
  planillasActivas: number;
  
  // Estados
  porEstado: Array<{ estado: string; count: number }>;
  
  // Kilometraje
  kmSalidaTotal: number;
  kmLlegadaTotal: number;
  kmRecorridos: number;
  kmPromedioPorViaje: number;
  
  // Por sucursal origen
  porSucursalOrigen: Array<{ sucursal: string; count: number }>;
  porSucursalDestino: Array<{ sucursal: string; count: number }>;
}

// =============================================================================
// ALERTAS DE MANTENIMIENTO Y VENCIMIENTOS
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
// RESUMEN EJECUTIVO (PARA KPI CARDS)
// =============================================================================

export interface ResumenEjecutivo {
  // Hoy
  remitosHoy: number;
  hojasHoy: number;
  
  // Este mes
  remitosEsteMes: number;
  valorDeclaradoEsteMes: number;
  entregasExitosas: number;
  rechazos: number;
  tasaEntrega: number;
  
  // Flota
  flotaTotal: number;
  flotaDisponible: number;
  flotaEnRuta: number;
  flotaEnMantenimiento: number;
  utilizacionFlota: number;
  
  // Personas
  choferesDisponibles: number;
  alertasLicencias: number;
  
  // Terceros
  tercerosActivos: number;
  alertasVencimientos: number;
  
  // Consultas
  consultasPendientes: number;
  
  // Tendencia vs mes anterior
  variacionRemitos: number;
  variacionValor: number;
}

// =============================================================================
// TENDENCIA TEMPORAL
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