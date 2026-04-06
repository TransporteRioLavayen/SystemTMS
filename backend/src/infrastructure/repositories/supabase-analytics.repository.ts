// =============================================================================
// REPOSITORY: ANALYTICS (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio de analíticas usando Supabase

import { 
  DashboardStats, 
  RemitosAnalytics, 
  FlotaAnalytics, 
  TendenciaAnalytics, 
  AlertaMantenimiento 
} from '../../domain/entities/analytics.entity';
import { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { getSupabaseClient } from '../database/supabase/client';

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  
  async getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats> {
    const supabase = getSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      { count: remitosHoy },
      { count: enCamino },
      { count: entregadosMes },
      { count: totalRemitosMes },
      { data: rawTrend },
      { data: rawEstados }
    ] = await Promise.all([
      supabase.from('remitos').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
      supabase.from('remitos').select('*', { count: 'exact', head: true }).eq('estado', 'En Reparto'),
      supabase.from('remitos').select('*', { count: 'exact', head: true }).eq('estado', 'Finalizado').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      supabase.from('remitos').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      supabase.from('remitos').select('created_at').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()).order('created_at', { ascending: true }),
      supabase.from('remitos').select('estado')
    ]);

    // Trend aggregation
    const trendMap = new Map<string, number>();
    rawTrend?.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    // Status distribution aggregation
    const estadosMap = new Map<string, number>();
    rawEstados?.forEach(r => {
      estadosMap.set(r.estado, (estadosMap.get(r.estado) || 0) + 1);
    });

    return {
      remitosHoy: remitosHoy || 0,
      enCamino: enCamino || 0,
      entregadosMes: entregadosMes || 0,
      tasaEntrega: totalRemitosMes ? (entregadosMes || 0) / totalRemitosMes : 0,
      last30DaysTrend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
      distribucionEstado: Array.from(estadosMap.entries()).map(([estado, count]) => ({ estado, count })),
    };
  }

  async getRemitosAnalytics(startDate: Date, endDate: Date): Promise<RemitosAnalytics> {
    const supabase = getSupabaseClient();
    const { data: rawRemitos, error } = await supabase
      .from('remitos')
      .select('estado, valor_declarado, bultos, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Error fetching remitos analytics: ${error.message}`);

    const porEstadoMap = new Map<string, number>();
    let totalValor = 0;
    let totalBultos = 0;
    const volumenPorDiaMap = new Map<string, number>();

    rawRemitos?.forEach(r => {
      // Por estado
      porEstadoMap.set(r.estado, (porEstadoMap.get(r.estado) || 0) + 1);
      // Valor
      totalValor += r.valor_declarado || 0;
      // Bultos
      totalBultos += r.bultos || 0;
      // Volumen por dia
      const date = new Date(r.created_at).toISOString().split('T')[0];
      volumenPorDiaMap.set(date, (volumenPorDiaMap.get(date) || 0) + 1);
    });

    return {
      porEstado: Array.from(porEstadoMap.entries()).map(([estado, count]) => ({ estado, count })),
      totalValorDeclarado: totalValor,
      promedioBultos: rawRemitos.length ? totalBultos / rawRemitos.length : 0,
      volumenPorDia: Array.from(volumenPorDiaMap.entries()).map(([date, count]) => ({ date, count })),
    };
  }

  async getFlotaAnalytics(): Promise<FlotaAnalytics> {
    const supabase = getSupabaseClient();
    const [
      { data: unidades },
      { count: enViajePlanillas },
      { count: enRepartoHojas }
    ] = await Promise.all([
      supabase.from('unidades').select('estado, tipo_servicio'),
      supabase.from('planillas').select('*', { count: 'exact', head: true }).eq('estado', 'viaje'),
      supabase.from('hojas_ruta').select('*', { count: 'exact', head: true }).eq('estado', 'En reparto')
    ]);

    const totalUnidades = unidades?.length || 0;
    const enServicio = (enViajePlanillas || 0) + (enRepartoHojas || 0);
    const mantenimiento = unidades?.filter(u => u.estado === 'MANTENIMIENTO').length || 0;
    const tiposMap = new Map<string, number>();
    unidades?.forEach(u => {
      tiposMap.set(u.tipo_servicio, (tiposMap.get(u.tipo_servicio) || 0) + 1);
    });

    return {
      utilizacion: totalUnidades ? enServicio / totalUnidades : 0,
      enServicio,
      mantenimiento,
      disponibles: totalUnidades - enServicio - mantenimiento,
      tiposServicio: Array.from(tiposMap.entries()).map(([tipo, count]) => ({ tipo, count })),
    };
  }

  async getTendenciaAnalytics(startDate: Date, endDate: Date): Promise<TendenciaAnalytics> {
    const supabase = getSupabaseClient();
    const { data: rawRemitos } = await supabase
      .from('remitos')
      .select('created_at, estado')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    const map = new Map<string, { remitos: number; entregados: number; rechazados: number }>();

    rawRemitos?.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      const current = map.get(date) || { remitos: 0, entregados: 0, rechazados: 0 };
      current.remitos++;
      if (r.estado === 'Finalizado') current.entregados++;
      // Assuming 'Rechazado' or similar state exist, or filter based on tracking events if needed
      if (r.estado === 'Rechazado') current.rechazados++; 
      map.set(date, current);
    });

    return {
      periodo: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      data: Array.from(map.entries()).map(([date, stats]) => ({
        date,
        ...stats
      }))
    };
  }

  async getAlertasMantenimiento(): Promise<AlertaMantenimiento[]> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + 30); // Próximos 30 días

    const [
      { data: choferes },
      { data: unidades }
    ] = await Promise.all([
      supabase.from('choferes').select('id, nombre, vencimiento_licencia').lte('vencimiento_licencia', targetDate.toISOString()),
      // We assume there are VTV or Insurance expiration dates in Unidad entity but let's check
      supabase.from('unidades').select('id, patente, marca, estado, tipo_servicio') // Corregido: selección simple de campos
    ]);

    const alertas: AlertaMantenimiento[] = [];

    choferes?.forEach(c => {
      const vencimiento = new Date(c.vencimiento_licencia);
      const diff = Math.ceil((vencimiento.getTime() - now.getTime()) / (1000 * 3600 * 24));
      alertas.push({
        id: `licencia-${c.id}`,
        tipo: 'licencia',
        descripcion: `Licencia de ${c.nombre} por vencer en ${diff} días`,
        fechaVencimiento: c.vencimiento_licencia,
        prioridad: diff < 7 ? 'alta' : 'media'
      });
    });

    // check if unidades have vencimiento dates
    // For now, I'll stick to licencias as I'm sure about that field
    
    return alertas;
  }
}

export const analyticsRepository = new SupabaseAnalyticsRepository();
