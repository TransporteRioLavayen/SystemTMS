import { useState, useEffect, useCallback } from 'react';
import { 
  analyticsService, 
  DashboardStats, 
  ResumenEjecutivo,
  FlotaAnalytics, 
  HojasRutaAnalytics,
  ChoferesAnalytics,
  TercerosAnalytics,
  AlertaMantenimiento 
} from '../../infrastructure/services/analyticsService';

export function useAnalytics() {
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [flota, setFlota] = useState<FlotaAnalytics | null>(null);
  const [hojasRuta, setHojasRuta] = useState<HojasRutaAnalytics | null>(null);
  const [choferes, setChoferes] = useState<ChoferesAnalytics | null>(null);
  const [terceros, setTerceros] = useState<TercerosAnalytics | null>(null);
  const [alertas, setAlertas] = useState<AlertaMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [r, s, f, hr, ch, t, a] = await Promise.all([
        analyticsService.getResumen(),
        analyticsService.getDashboardStats(startDate, endDate),
        analyticsService.getFlotaAnalytics(),
        analyticsService.getHojasRutaAnalytics(startDate, endDate),
        analyticsService.getChoferesAnalytics(),
        analyticsService.getTercerosAnalytics(),
        analyticsService.getAlertas()
      ]);
      setResumen(r);
      setStats(s);
      setFlota(f);
      setHojasRuta(hr);
      setChoferes(ch);
      setTerceros(t);
      setAlertas(a);
    } catch (err: any) {
      setError(err.message || 'Error al cargar analíticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    resumen,
    stats,
    flota,
    hojasRuta,
    choferes,
    terceros,
    alertas,
    loading,
    error,
    refresh: fetchAll
  };
}