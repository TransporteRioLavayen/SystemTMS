import { useMemo } from 'react';
import { usePlanillasContext } from '../context/PlanillasContext';

export const usePlanillas = () => {
  const { 
    planillas, 
    planillasLoading,
    planillasError,
    guardarBorrador, 
    confirmarViajeContext, 
    confirmarLlegadaContext,
    finalizarControlContext,
    actualizarPlanilla,
    eliminarPlanilla,
    filterEstado,
    setFilterEstado,
    refreshPlanillas
  } = usePlanillasContext();

  const planillasBorrador = useMemo(() => planillas.filter(p => p.estado === 'borrador'), [planillas]);
  const planillasViaje = useMemo(() => planillas.filter(p => p.estado === 'viaje'), [planillas]);
  const planillasControl = useMemo(() => planillas.filter(p => p.estado === 'control'), [planillas]);
  const planillasCompletadas = useMemo(() => planillas.filter(p => p.estado === 'completo' || p.estado === 'incompleto'), [planillas]);

  const todasLasPlanillas = useMemo(() => {
    return [...planillas].sort((a, b) => b.id.localeCompare(a.id));
  }, [planillas]);

  const metrics = useMemo(() => {
    const totalBorrador = planillasBorrador.length;
    const totalViaje = planillasViaje.length;
    const totalCompletadas = planillasCompletadas.length;
    const totalRemitosViaje = planillasViaje.reduce((acc, p) => acc + p.remitos.length, 0);

    return [
      { label: 'En Borrador', value: totalBorrador.toString(), bg: 'bg-amber-100', color: 'text-amber-600' },
      { label: 'En Viaje', value: totalViaje.toString(), bg: 'bg-blue-100', color: 'text-blue-600' },
      { label: 'Completadas', value: totalCompletadas.toString(), bg: 'bg-emerald-100', color: 'text-emerald-600' },
      { label: 'Remitos en Tránsito', value: totalRemitosViaje.toString(), bg: 'bg-purple-100', color: 'text-purple-600' },
    ];
  }, [planillasBorrador, planillasViaje, planillasCompletadas]);

  return {
    planillasBorrador,
    planillasViaje,
    planillasControl,
    planillasCompletadas,
    todasLasPlanillas,
    todasLasPlanillasRaw: planillas,
    metrics,
    planillasLoading,
    planillasError,
    guardarBorrador,
    confirmarViaje: confirmarViajeContext,
    confirmarLlegada: confirmarLlegadaContext,
    finalizarControl: finalizarControlContext,
    actualizarPlanilla,
    eliminarPlanilla,
    filterEstado,
    setFilterEstado,
    refreshPlanillas
  };
};
