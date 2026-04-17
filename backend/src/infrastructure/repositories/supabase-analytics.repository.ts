// =============================================================================
// REPOSITORY: ANALYTICS (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación completa de analíticas usando Supabase
// Basado en schema real con todas las tablas

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
} from '../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { getSupabaseClient } from '../database/supabase/client';

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  
  // =============================================================================
  // DASHBOARD PRINCIPAL
  // =============================================================================
  
  async getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats> {
    const supabase = getSupabaseClient();
    
    // Fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Inicio de mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Queries paralelas
    const [
      { count: remitosHoy },
      { count: remitosAyer },
      { count: enCamino },
      { count: entregadosMes },
      { count: rechazosMes },
      { count: totalMes },
      { data: rawTrend },
      { data: rawEstados },
      { data: remitosMes }
    ] = await Promise.all([
      // Remitos hoy
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
      // Remitos ayer
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
      // En camino (En Reparto)
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .eq('estado', 'En Reparto'),
      // Entregados este mes
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .eq('estado', 'Finalizado')
        .gte('created_at', startOfMonth.toISOString()).lte('created_at', endDate.toISOString()),
      // Rechazados este mes (asumiendo Por reasignar = rechazo)
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .eq('estado', 'Por reasignar')
        .gte('created_at', startOfMonth.toISOString()).lte('created_at', endDate.toISOString()),
      // Total mes
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()).lte('created_at', endDate.toISOString()),
      // Trend 30 días
      supabase.from('remitos').select('created_at')
        .gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true }),
      // Todos los estados
      supabase.from('remitos').select('estado'),
      // Remitos del mes para valores
      supabase.from('remitos').select('valor_declarado, bultos')
        .gte('created_at', startOfMonth.toISOString()).lte('created_at', endDate.toISOString())
    ]);

    // Calcular valores
    let valorDeclaradoMes = 0;
    let bultosEntregadosMes = 0;
    remitosMes?.forEach(r => {
      valorDeclaradoMes += r.valor_declarado || 0;
      bultosEntregadosMes += r.bultos || 0;
    });

    // Trend aggregation
    const trendMap = new Map<string, number>();
    rawTrend?.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    // Estados aggregation
    const estadosMap = new Map<string, number>();
    rawEstados?.forEach(r => {
      estadosMap.set(r.estado || 'Sin estado', (estadosMap.get(r.estado) || 0) + 1);
    });

    // Cálculos
    const totalRemitosMes = totalMes || 0;
    const countEntregados = entregadosMes || 0;
    const countRechazos = rechazosMes || 0;
    const countRemitosHoy = remitosHoy || 0;
    const countRemitosAyer = remitosAyer || 0;
    
    const variacionRemitos = countRemitosAyer > 0 
      ? ((countRemitosHoy - countRemitosAyer) / countRemitosAyer) * 100 
      : 0;

    return {
      remitosHoy: countRemitosHoy,
      remitosAyer: countRemitosAyer,
      variacionRemitos: Math.round(variacionRemitos * 10) / 10,
      enCamino: enCamino || 0,
      entregadosMes: countEntregados,
      rechazadosMes: countRechazos,
      tasaEntrega: totalRemitosMes > 0 ? countEntregados / totalRemitosMes : 0,
      tasaRechazo: totalRemitosMes > 0 ? countRechazos / totalRemitosMes : 0,
      last30DaysTrend: Array.from(trendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
      distribucionEstado: Array.from(estadosMap.entries())
        .map(([estado, count]) => ({ estado, count })),
      valorDeclaradoMes: valorDeclaradoMes,
      bultosEntregadosMes: bultosEntregadosMes,
      promedioBultosPorRemito: totalRemitosMes > 0 
        ? Math.round((bultosEntregadosMes / totalRemitosMes) * 10) / 10 
        : 0
    };
  }

  // =============================================================================
  // REMITOS ANALYTICS
  // =============================================================================
  
  async getRemitosAnalytics(startDate: Date, endDate: Date): Promise<RemitosAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: rawRemitos, error } = await supabase
      .from('remitos')
      .select('estado, valor_declarado, bultos, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Error fetching remitos: ${error.message}`);

    const porEstadoMap = new Map<string, number>();
    let totalValor = 0;
    let totalBultos = 0;
    const volumenPorDiaMap = new Map<string, number>();
    
    let entregados = 0;
    let rechazados = 0;
    let enCurso = 0;

    rawRemitos?.forEach(r => {
      const estado = r.estado || 'Sin estado';
      
      // Por estado
      porEstadoMap.set(estado, (porEstadoMap.get(estado) || 0) + 1);
      
      // Contadores
      if (estado === 'Finalizado') entregados++;
      else if (estado === 'Por reasignar' || estado === 'Rechazado') rechazados++;
      else if (estado === 'En Reparto' || estado === 'En viaje') enCurso++;
      
      // Valor
      totalValor += r.valor_declarado || 0;
      
      // Bultos
      totalBultos += r.bultos || 0;
      
      // Volumen por día
      const date = new Date(r.created_at).toISOString().split('T')[0];
      volumenPorDiaMap.set(date, (volumenPorDiaMap.get(date) || 0) + 1);
    });

    const totalRemitos = rawRemitos?.length || 0;

    return {
      totalRemitos,
      remitosPorEstado: Array.from(porEstadoMap.entries())
        .map(([estado, count]) => ({ estado, count })),
      remitosPorDia: Array.from(volumenPorDiaMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
      valorDeclaradoTotal: totalValor,
      valorPromedioPorRemito: totalRemitos > 0 ? totalValor / totalRemitos : 0,
      bultosTotal: totalBultos,
      promedioBultos: totalRemitos > 0 ? totalBultos / totalRemitos : 0,
      tiempoPromedioEntrega: 0, // TODO: calcular si hay fecha_entrega en remitos
      tasaEntrega: totalRemitos > 0 ? entregados / totalRemitos : 0,
      tasaRechazo: totalRemitos > 0 ? rechazados / totalRemitos : 0,
      tasaEnCurso: totalRemitos > 0 ? enCurso / totalRemitos : 0
    };
  }

  // =============================================================================
  // FLOTA ANALYTICS
  // =============================================================================
  
  async getFlotaAnalytics(): Promise<FlotaAnalytics> {
    const supabase = getSupabaseClient();
    
    const [
      { data: unidades },
      { count: enViajePlanillas },
      { count: enRepartoHojas }
    ] = await Promise.all([
      supabase.from('unidades').select('estado, tipo, tipo_servicio'),
      supabase.from('planillas').select('*', { count: 'exact', head: true })
        .eq('estado', 'viaje'),
      supabase.from('hojas_ruta').select('*', { count: 'exact', head: true })
        .eq('estado', 'En reparto')
    ]);

    const total = unidades?.length || 0;
    const disponibles = unidades?.filter(u => u.estado === 'DISPONIBLE').length || 0;
    const mantenimiento = unidades?.filter(u => u.estado === 'MANTENIMIENTO').length || 0;
    const enRuta = (enViajePlanillas || 0) + (enRepartoHojas || 0);
    const fueraDeServicio = total - disponibles - enRuta - mantenimiento;

    // Por tipo
    const tipoMap = new Map<string, number>();
    // Por servicio
    const servicioMap = new Map<string, number>();
    
    unidades?.forEach(u => {
      tipoMap.set(u.tipo || 'otro', (tipoMap.get(u.tipo) || 0) + 1);
      servicioMap.set(u.tipo_servicio || 'corta_distancia', (servicioMap.get(u.tipo_servicio) || 0) + 1);
    });

    return {
      totalUnidades: total,
      disponibles,
      enRuta,
      mantenimiento,
      fueraDeServicio: fueraDeServicio > 0 ? fueraDeServicio : 0,
      utilizacionPorcentaje: total > 0 ? enRuta / total : 0,
      porTipo: Array.from(tipoMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      porTipoServicio: Array.from(servicioMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      tendenciaUtilizacion: [] // TODO: implementar si hay histórico
    };
  }

  // =============================================================================
  // HOJAS DE RUTA ANALYTICS
  // =============================================================================
  
  async getHojasRutaAnalytics(startDate: Date, endDate: Date): Promise<HojasRutaAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: hojas, error } = await supabase
      .from('hojas_ruta')
      .select('*, deposito:depositos(numero_zona)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Error fetching hojas ruta: ${error.message}`);

    const porEstadoMap = new Map<string, number>();
    const porTipoFlotaMap = new Map<string, number>();
    const porTipoServicioMap = new Map<string, number>();
    const porZonaMap = new Map<number, number>();
    
    let kmTotales = 0;
    let hojasCompletadas = 0;
    let hojasActivas = 0;
    
    let cargasEntregadas = 0;
    let cargasRechazadas = 0;
    let totalCargas = 0;

    hojas?.forEach(h => {
      const estado = h.estado || 'preparando';
      const tipoFlota = h.tipo_flota || 'propia';
      const tipoServicio = h.tipo_servicio || 'corta_distancia';
      const zona = h.deposito?.numero_zona || 0;
      
      porEstadoMap.set(estado, (porEstadoMap.get(estado) || 0) + 1);
      porTipoFlotaMap.set(tipoFlota, (porTipoFlotaMap.get(tipoFlota) || 0) + 1);
      porTipoServicioMap.set(tipoServicio, (porTipoServicioMap.get(tipoServicio) || 0) + 1);
      porZonaMap.set(zona, (porZonaMap.get(zona) || 0) + 1);
      
      // Km
      const km = (h.km_llegada || 0) - (h.km_salida || 0);
      if (km > 0) kmTotales += km;
      
      // Estados
      if (estado === 'En reparto' || estado === 'Lista para salir') hojasActivas++;
      if (estado === 'Completada' || estado === 'Finalizó reparto') hojasCompletadas++;
    });

    // Cargas - obtener de hoja_ruta_remitos
    const { data: cargas } = await supabase
      .from('hoja_ruta_remitos')
      .select('estado_entrega');
    
    cargas?.forEach(c => {
      totalCargas++;
      if (c.estado_entrega === 'Entregado') cargasEntregadas++;
      if (c.estado_entrega === 'Rechazado') cargasRechazadas++;
    });

    const total = hojas?.length || 0;

    return {
      totalHojas: total,
      hojasActivas,
      hojasCompletadas,
      porEstado: Array.from(porEstadoMap.entries())
        .map(([estado, count]) => ({ estado, count })),
      kmTotales,
      kmPromedioPorHoja: total > 0 ? kmTotales / total : 0,
      porTipoFlota: Array.from(porTipoFlotaMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      porTipoServicio: Array.from(porTipoServicioMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      porZona: Array.from(porZonaMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([zona, count]) => ({ zona: zona.toString(), count })),
      promedioCargasPorHoja: total > 0 ? totalCargas / total : 0,
      cargasEntregadas,
      cargasRechazadas
    };
  }

  // =============================================================================
  // CHOFERES ANALYTICS
  // =============================================================================
  
  async getChoferesAnalytics(): Promise<ChoferesAnalytics> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + 30);

    const { data: choferes } = await supabase
      .from('choferes')
      .select('id, nombre, dni, estado, vencimiento_licencia');

    const disponibles = choferes?.filter(c => c.estado === 'DISPONIBLE').length || 0;
    const enRuta = choferes?.filter(c => c.estado === 'EN_RUTA').length || 0;
    const inactivos = choferes?.filter(c => c.estado === 'INACTIVO').length || 0;

    // Licencias por vencer
    const licenciasPorVencer: Array<{
      id: string;
      nombre: string;
      dni: string;
      vencimiento: string;
      diasRestantes: number;
    }> = [];

    let alertasLicencias = 0;

    choferes?.forEach(c => {
      const vencimiento = new Date(c.vencimiento_licencia);
      const diff = Math.ceil((vencimiento.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (diff <= 30) {
        licenciasPorVencer.push({
          id: c.id,
          nombre: c.nombre,
          dni: c.dni,
          vencimiento: c.vencimiento_licencia,
          diasRestantes: diff
        });
        if (diff <= 7) alertasLicencias++;
      }
    });

    return {
      totalChoferes: choferes?.length || 0,
      disponibles,
      enRuta,
      inactivos,
      licenciasPorVencer: licenciasPorVencer.sort((a, b) => a.diasRestantes - b.diasRestantes),
      alertasactivas: alertasLicencias
    };
  }

  // =============================================================================
  // TERCEROS ANALYTICS
  // =============================================================================
  
  async getTercerosAnalytics(): Promise<TercerosAnalytics> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + 30);

    const { data: terceros } = await supabase
      .from('terceros')
      .select('*');

    const activos = terceros?.filter(t => t.estado === 'activo').length || 0;
    const inactivos = terceros?.filter(t => t.estado === 'inactivo').length || 0;

    // Por tipo servicio
    const servicioMap = new Map<string, number>();
    // Por tipo unidad
    const unidadMap = new Map<string, number>();
    
    terceros?.forEach(t => {
      servicioMap.set(t.tipo_servicio || 'corta_distancia', (servicioMap.get(t.tipo_servicio) || 0) + 1);
      unidadMap.set(t.tipo_unidad || 'Semi', (unidadMap.get(t.tipo_unidad) || 0) + 1);
    });

    // Vencimientos
    const segurosPorVencer: any[] = [];
    const vtvPorVencer: any[] = [];
    const licenciasPorVencer: any[] = [];
    let alertas = 0;

    terceros?.forEach(t => {
      // Seguros
      if (t.vencimiento_seguro) {
        const vto = new Date(t.vencimiento_seguro);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          segurosPorVencer.push({
            id: t.id,
            razonSocial: t.razon_social,
            patenteTractor: t.patente_tractor,
            vencimiento: t.vencimiento_seguro,
            diasRestantes: diff
          });
          if (diff <= 7) alertas++;
        }
      }
      
      // VTV
      if (t.vencimiento_vtv) {
        const vto = new Date(t.vencimiento_vtv);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          vtvPorVencer.push({
            id: t.id,
            razonSocial: t.razon_social,
            patenteTractor: t.patente_tractor,
            vencimiento: t.vencimiento_vtv,
            diasRestantes: diff
          });
          if (diff <= 7) alertas++;
        }
      }
      
      // Licencias
      if (t.vencimiento_licencia) {
        const vto = new Date(t.vencimiento_licencia);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          licenciasPorVencer.push({
            id: t.id,
            nombreChofer: t.nombre_chofer,
            dni: t.dni_chofer,
            razonSocial: t.razon_social,
            vencimiento: t.vencimiento_licencia,
            diasRestantes: diff
          });
          if (diff <= 7) alertas++;
        }
      }
    });

    return {
      totalTerceros: terceros?.length || 0,
      activos,
      inactivos,
      porTipoServicio: Array.from(servicioMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      porTipoUnidad: Array.from(unidadMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      segurosPorVencer: segurosPorVencer.sort((a, b) => a.diasRestantes - b.diasRestantes),
      vtvPorVencer: vtvPorVencer.sort((a, b) => a.diasRestantes - b.diasRestantes),
      licenciasPorVencer: licenciasPorVencer.sort((a, b) => a.diasRestantes - b.diasRestantes),
      alertasActivas: alertas
    };
  }

  // =============================================================================
  // DEPOSITOS ANALYTICS
  // =============================================================================
  
  async getDepositosAnalytics(): Promise<DepositosAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: depositos } = await supabase
      .from('depositos')
      .select('*');

    const activos = depositos?.filter(d => d.estado === 'activo').length || 0;

    // Por zona
    const zonaMap = new Map<number, { count: number; capacidadTotal: number }>();
    
    depositos?.forEach(d => {
      const zona = d.numero_zona || 0;
      const current = zonaMap.get(zona) || { count: 0, capacidadTotal: 0 };
      zonaMap.set(zona, {
        count: current.count + 1,
        capacidadTotal: current.capacidadTotal + (d.capacidad || 0)
      });
    });

    return {
      totalDepositos: depositos?.length || 0,
      activos,
      porZona: Array.from(zonaMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([zona, data]) => ({ zona, count: data.count, capacidadTotal: data.capacidadTotal })),
      detalle: depositos?.map(d => ({
        id: d.id,
        nombre: d.nombre,
        zona: d.numero_zona || 0,
        capacidad: d.capacidad || 0,
        cargasActivas: 0, // TODO: calcular si hay relación con cargas
        porcentajeOcupacion: 0
      })) || []
    };
  }

  // =============================================================================
  // CONSULTAS ANALYTICS
  // =============================================================================
  
  async getConsultasAnalytics(startDate: Date, endDate: Date): Promise<ConsultasAnalytics> {
    const supabase = getSupabaseClient();
    
    // Inicio de mes actual y anterior
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      { data: consultas },
      { count: total },
      { count: pendientes },
      { count: enProceso },
      { count: respondidas },
      { count: cerradas },
      { count: mesActual },
      { count: mesAnterior }
    ] = await Promise.all([
      supabase.from('consultas').select('tipo_consulta, estado, created_at, updated_at'),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('estado', 'en_proceso'),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('estado', 'respondida'),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('estado', 'cerrada'),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString())
    ]);

    // Por tipo
    const tipoMap = new Map<string, number>();
    let tiempoTotal = 0;
    let responseCount = 0;

    consultas?.forEach(c => {
      tipoMap.set(c.tipo_consulta || 'otro', (tipoMap.get(c.tipo_consulta) || 0) + 1);
      
      // Tiempo promedio
      if (c.estado === 'respondida' || c.estado === 'cerrada') {
        const created = new Date(c.created_at).getTime();
        const updated = new Date(c.updated_at).getTime();
        tiempoTotal += (updated - created) / (1000 * 3600); // horas
        responseCount++;
      }
    });

    const variacion = mesAnterior ? ((mesActual || 0) - (mesAnterior || 0)) / (mesAnterior || 0) * 100 : 0;

    return {
      totalConsultas: total || 0,
      consultasMesActual: mesActual || 0,
      consultasMesAnterior: mesAnterior || 0,
      variacionPorcentual: Math.round(variacion * 10) / 10,
      pendientes: pendientes || 0,
      enProceso: enProceso || 0,
      respondidas: respondidas || 0,
      cerradas: cerradas || 0,
      porTipo: Array.from(tipoMap.entries())
        .map(([tipo, count]) => ({ tipo, count })),
      tiempoPromedioRespuesta: responseCount > 0 ? tiempoTotal / responseCount : 0
    };
  }

  // =============================================================================
  // COTIZACIONES ANALYTICS
  // =============================================================================
  
  async getCotizacionesAnalytics(startDate: Date, endDate: Date): Promise<CotizacionesAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: cotizaciones, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Error fetching cotizaciones: ${error.message}`);

    const tipoCargaMap = new Map<string, { count: number; valorTotal: number }>();
    const zonaMap = new Map<number, { count: number; valorTotal: number }>();
    
    let valorTotal = 0;
    let conEntrega = 0;
    let sinEntrega = 0;

    cotizaciones?.forEach(c => {
      const tipo = c.tipo_carga || 'otro';
      const zona = c.zona_destino || 0;
      
      // Por tipo carga
      const tipoCurrent = tipoCargaMap.get(tipo) || { count: 0, valorTotal: 0 };
      tipoCargaMap.set(tipo, {
        count: tipoCurrent.count + 1,
        valorTotal: tipoCurrent.valorTotal + (c.precio_total || 0)
      });
      
      // Por zona
      const zonaCurrent = zonaMap.get(zona) || { count: 0, valorTotal: 0 };
      zonaMap.set(zona, {
        count: zonaCurrent.count + 1,
        valorTotal: zonaCurrent.valorTotal + (c.precio_total || 0)
      });
      
      valorTotal += c.precio_total || 0;
      if (c.entrega_domicilio) conEntrega++;
      else sinEntrega++;
    });

    const total = cotizaciones?.length || 0;

    return {
      totalCotizaciones: total,
      cotizacionesMes: total,
      valorTotal: valorTotal,
      valorPromedio: total > 0 ? valorTotal / total : 0,
      porTipoCarga: Array.from(tipoCargaMap.entries())
        .map(([tipo, data]) => ({ tipo, count: data.count, valorTotal: data.valorTotal })),
      porZona: Array.from(zonaMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([zona, data]) => ({ zona, count: data.count, valorTotal: data.valorTotal })),
      conEntregaDomicilio: conEntrega,
      sinEntregaDomicilio: sinEntrega
    };
  }

  // =============================================================================
  // PLANILLAS ANALYTICS
  // =============================================================================
  
  async getPlanillasAnalytics(startDate: Date, endDate: Date): Promise<PlanillasAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: planillas, error } = await supabase
      .from('planillas')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Error fetching planillas: ${error.message}`);

    const estadoMap = new Map<string, number>();
    const origenMap = new Map<string, number>();
    const destinoMap = new Map<string, number>();
    
    let kmSalidaTotal = 0;
    let kmLlegadaTotal = 0;
    let activas = 0;

    planillas?.forEach(p => {
      estadoMap.set(p.estado || 'borrador', (estadoMap.get(p.estado) || 0) + 1);
      origenMap.set(p.sucursal_origen || 'sin origen', (origenMap.get(p.sucursal_origen) || 0) + 1);
      if (p.sucursal_destino) {
        destinoMap.set(p.sucursal_destino, (destinoMap.get(p.sucursal_destino) || 0) + 1);
      }
      
      kmSalidaTotal += p.km_salida || 0;
      kmLlegadaTotal += p.km_llegada || 0;
      
      if (p.estado === 'viaje' || p.estado === 'control') activas++;
    });

    const total = planillas?.length || 0;
    const kmRecorridos = kmLlegadaTotal - kmSalidaTotal;

    return {
      totalPlanillas: total,
      planillasActivas: activas,
      porEstado: Array.from(estadoMap.entries())
        .map(([estado, count]) => ({ estado, count })),
      kmSalidaTotal,
      kmLlegadaTotal,
      kmRecorridos: kmRecorridos > 0 ? kmRecorridos : 0,
      kmPromedioPorViaje: total > 0 ? kmRecorridos / total : 0,
      porSucursalOrigen: Array.from(origenMap.entries())
        .map(([sucursal, count]) => ({ sucursal, count })),
      porSucursalDestino: Array.from(destinoMap.entries())
        .map(([sucursal, count]) => ({ sucursal, count }))
    };
  }

  // =============================================================================
  // ALERTAS DE MANTENIMIENTO
  // =============================================================================
  
  async getAlertasMantenimiento(): Promise<AlertaMantenimiento[]> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + 30);

    const alertas: AlertaMantenimiento[] = [];

    // 1. Licencias de choferes
    const { data: choferes } = await supabase
      .from('choferes')
      .select('id, nombre, vencimiento_licencia');

    choferes?.forEach(c => {
      const vto = new Date(c.vencimiento_licencia);
      const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (diff <= 30) {
        alertas.push({
          id: `licencia-${c.id}`,
          tipo: 'licencia',
          entidad: 'chofer',
          descripcion: `Licencia de ${c.nombre} vence en ${diff} días`,
          fechaVencimiento: c.vencimiento_licencia,
          diasRestantes: diff,
          prioridad: diff <= 7 ? 'alta' : diff <= 15 ? 'media' : 'baja'
        });
      }
    });

    // 2. VTV y Seguros de unidades (asumiendo campos en tabla)
    // TODO: verificar nombres exactos de campos en tabla unidades
    const { data: unidades } = await supabase
      .from('unidades')
      .select('id, patente');

    // Por ahora solo licencias de terceros
    const { data: terceros } = await supabase
      .from('terceros')
      .select('id, razon_social, nombre_chofer, vencimiento_seguro, vencimiento_vtv, vencimiento_licencia');

    terceros?.forEach(t => {
      // Seguro
      if (t.vencimiento_seguro) {
        const vto = new Date(t.vencimiento_seguro);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          alertas.push({
            id: `seguro-tercero-${t.id}`,
            tipo: 'seguro_tercero',
            entidad: 'tercero',
            descripcion: `Seguro de ${t.razon_social} vence en ${diff} días`,
            fechaVencimiento: t.vencimiento_seguro,
            diasRestantes: diff,
            prioridad: diff <= 7 ? 'alta' : diff <= 15 ? 'media' : 'baja'
          });
        }
      }
      
      // VTV
      if (t.vencimiento_vtv) {
        const vto = new Date(t.vencimiento_vtv);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          alertas.push({
            id: `vtv-tercero-${t.id}`,
            tipo: 'vtv_tercero',
            entidad: 'tercero',
            descripcion: `VTV de ${t.razon_social} vence en ${diff} días`,
            fechaVencimiento: t.vencimiento_vtv,
            diasRestantes: diff,
            prioridad: diff <= 7 ? 'alta' : diff <= 15 ? 'media' : 'baja'
          });
        }
      }
      
      // Licencia
      if (t.vencimiento_licencia) {
        const vto = new Date(t.vencimiento_licencia);
        const diff = Math.ceil((vto.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff <= 30) {
          alertas.push({
            id: `licencia-tercero-${t.id}`,
            tipo: 'licencia',
            entidad: 'tercero',
            descripcion: `Licencia de ${t.nombre_chofer} (${t.razon_social}) vence en ${diff} días`,
            fechaVencimiento: t.vencimiento_licencia,
            diasRestantes: diff,
            prioridad: diff <= 7 ? 'alta' : diff <= 15 ? 'media' : 'baja'
          });
        }
      }
    });

    return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  // =============================================================================
  // TENDENCIAS
  // =============================================================================
  
  async getTendenciaAnalytics(startDate: Date, endDate: Date): Promise<TendenciaAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: rawRemitos } = await supabase
      .from('remitos')
      .select('created_at, estado, valor_declarado')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    const map = new Map<string, { remitos: number; entregados: number; rechazados: number; valor: number }>();

    rawRemitos?.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      const current = map.get(date) || { remitos: 0, entregados: 0, rechazados: 0, valor: 0 };
      current.remitos++;
      current.valor += r.valor_declarado || 0;
      if (r.estado === 'Finalizado') current.entregados++;
      if (r.estado === 'Por reasignar') current.rechazados++; 
      map.set(date, current);
    });

    return {
      periodo: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      data: Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stats]) => ({
          date,
          remitos: stats.remitos,
          entregados: stats.entregados,
          rechazados: stats.rechazados,
          valor: stats.valor
        }))
    };
  }

  // =============================================================================
  // RESUMEN EJECUTIVO (PARA KPI CARDS)
  // =============================================================================
  
  async getResumenEjecutivo(): Promise<ResumenEjecutivo> {
    const supabase = getSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Queries paralelas
    const [
      { count: remitosHoy },
      { count: remitosEsteMes },
      { data: remitosMes },
      { data: unidades },
      { count: enRuta },
      { data: choferes },
      { data: terceros },
      { count: consultasPendientes },
      { count: hojasHoy }
    ] = await Promise.all([
      // Remitos hoy
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
      // Remitos este mes
      supabase.from('remitos').select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      // Remitos mes para valores
      supabase.from('remitos').select('estado, valor_declarado')
        .gte('created_at', startOfMonth.toISOString()),
      // Unidades
      supabase.from('unidades').select('estado'),
      // En ruta (cualquiera)
      supabase.from('hojas_ruta').select('*', { count: 'exact', head: true })
        .eq('estado', 'En reparto'),
      // Choferes
      supabase.from('choferes').select('estado'),
      // Terceros
      supabase.from('terceros').select('estado'),
      // Consultas pendientes
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
      // Hojas hoy
      supabase.from('hojas_ruta').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString())
    ]);

    // Calcular valores
    let valorDeclarado = 0;
    let entregas = 0;
    let rechazos = 0;
    remitosMes?.forEach(r => {
      valorDeclarado += r.valor_declarado || 0;
      if (r.estado === 'Finalizado') entregas++;
      if (r.estado === 'Por reasignar') rechazos++;
    });

    const totalUnidades = unidades?.length || 0;
    const disponibles = unidades?.filter(u => u.estado === 'DISPONIBLE').length || 0;
    const enRutaCount = enRuta || 0;
    const mantenimiento = unidades?.filter(u => u.estado === 'MANTENIMIENTO').length || 0;
    
    const choferesDisp = choferes?.filter(c => c.estado === 'DISPONIBLE').length || 0;
    
    const tercerosAct = terceros?.filter(t => t.estado === 'activo').length || 0;

    // Variación vs mes anterior
    const { count: remitosUltimoMes } = await supabase
      .from('remitos').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart.toISOString()).lte('created_at', lastMonthEnd.toISOString());

    const variacionRemitos = remitosUltimoMes && remitosEsteMes 
      ? ((remitosEsteMes - remitosUltimoMes) / remitosUltimoMes) * 100 
      : 0;

    return {
      remitosHoy: remitosHoy || 0,
      hojasHoy: hojasHoy || 0,
      remitosEsteMes: remitosEsteMes || 0,
      valorDeclaradoEsteMes: valorDeclarado,
      entregasExitosas: entregas,
      rechazos,
      tasaEntrega: (remitosEsteMes || 0) > 0 ? entregas / (remitosEsteMes || 0) : 0,
      flotaTotal: totalUnidades,
      flotaDisponible: disponibles,
      flotaEnRuta: enRutaCount,
      flotaEnMantenimiento: mantenimiento,
      utilizacionFlota: totalUnidades > 0 ? enRutaCount / totalUnidades : 0,
      choferesDisponibles: choferesDisp,
      alertasLicencias: 0, // TODO: calcular
      tercerosActivos: tercerosAct,
      alertasVencimientos: 0,
      consultasPendientes: consultasPendientes || 0,
      variacionRemitos: Math.round(variacionRemitos * 10) / 10,
      variacionValor: 0
    };
  }
}

// Exportar instancia
export const analyticsRepository = new SupabaseAnalyticsRepository();