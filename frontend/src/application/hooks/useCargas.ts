// =============================================================================
// USE CARGAS HOOK
// =============================================================================
// Hook dedicado para GestionCargas que envuelve usePlanillas y provee
// datos memoizados específicos del módulo de cargas.
//
// Esto separa la lógica de Cargas de la de Planillas, evitando re-renders
// innecesarios y dando a Cargas su propia capa de abstracción.

import { useMemo, useState, useCallback } from 'react';
import { usePlanillas } from './usePlanillas';
import { Remito } from '../../domain/models/Planilla';
import { Package, Truck, ClipboardCheck, Map } from 'lucide-react';

export interface RemitoListo extends Remito {
  planillaId: string;
  planillaEstado: string;
  sucursalOrigen: string;
}

export interface MetricaCarga {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
}

export const useCargas = () => {
  const {
    planillasViaje,
    planillasControl,
    planillasCompletadas,
    planillasLoading,
    planillasError,
    confirmarLlegada,
    finalizarControl,
    refreshPlanillas,
  } = usePlanillas();

  // Memoized: Remitos listos para hoja de ruta
  const remitosListos = useMemo<RemitoListo[]>(() =>
    planillasCompletadas.flatMap(p =>
      p.remitos.map(r => ({
        ...r,
        planillaId: p.id,
        planillaEstado: p.estado,
        sucursalOrigen: p.sucursal,
      }))
    ),
    [planillasCompletadas]
  );

  // Memoized: Métricas
  const totalCargas = planillasViaje.length + planillasControl.length + planillasCompletadas.length;
  const totalRemitosListos = remitosListos.length;

  const metrics = useMemo<MetricaCarga[]>(() => [
    { title: 'Total Cargas', value: totalCargas.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'En Camino', value: planillasViaje.length.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Para Control', value: planillasControl.length.toString(), icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Remitos p/ Ruta', value: totalRemitosListos.toString(), icon: Map, color: 'text-green-600', bg: 'bg-green-100' },
  ], [totalCargas, planillasViaje.length, planillasControl.length, totalRemitosListos]);

  // Memoized: Handlers con loading states
  const [isConfirmingLlegada, setIsConfirmingLlegada] = useState(false);
  const [isConfirmingControl, setIsConfirmingControl] = useState(false);

  const handleConfirmarLlegada = useCallback(async (planillaId: string, kmLlegada: number) => {
    setIsConfirmingLlegada(true);
    try {
      await confirmarLlegada(planillaId, kmLlegada);
    } finally {
      setIsConfirmingLlegada(false);
    }
  }, [confirmarLlegada]);

  const handleFinalizarControl = useCallback(async (planillaId: string, remitos: Remito[]) => {
    setIsConfirmingControl(true);
    try {
      await finalizarControl(planillaId, remitos);
    } finally {
      setIsConfirmingControl(false);
    }
  }, [finalizarControl]);

  return {
    // Data
    planillasViaje,
    planillasControl,
    planillasCompletadas,
    remitosListos,
    metrics,
    totalCargas,
    totalRemitosListos,

    // State
    planillasLoading,
    planillasError,
    isConfirmingLlegada,
    isConfirmingControl,

    // Actions
    confirmarLlegada: handleConfirmarLlegada,
    finalizarControl: handleFinalizarControl,
    refreshPlanillas,
  };
};
