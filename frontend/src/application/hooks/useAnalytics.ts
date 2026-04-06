import { useState, useEffect } from 'react';
import { analyticsService, DashboardStats, RemitosAnalytics, FlotaAnalytics, AlertaMantenimiento } from '../../infrastructure/services/analyticsService';

export function useAnalytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [remitosData, setRemitosData] = useState<RemitosAnalytics | null>(null);
  const [flotaData, setFlotaData] = useState<FlotaAnalytics | null>(null);
  const [alertas, setAlertas] = useState<AlertaMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [s, r, f, a] = await Promise.all([
        analyticsService.getDashboardStats(startDate, endDate),
        analyticsService.getRemitosAnalytics(startDate, endDate),
        analyticsService.getFlotaAnalytics(),
        analyticsService.getAlertas()
      ]);
      setStats(s);
      setRemitosData(r);
      setFlotaData(f);
      setAlertas(a);
    } catch (err: any) {
      setError(err.message || 'Error al cargar analíticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    stats,
    remitosData,
    flotaData,
    alertas,
    loading,
    error,
    refresh: fetchAll
  };
}
