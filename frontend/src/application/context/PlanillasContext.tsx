// =============================================================================
// PLANILLAS CONTEXT - FRONTEND
// =============================================================================
// Context para gestionar planillas. Toda la gestión de datos es a través
// del backend via API REST. El frontend solo escucha y muestra datos.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { planillaService, Planilla as PlanillaBackend, CreatePlanillaInput, UpdatePlanillaInput, Remito } from '../../infrastructure/services/planillaService';
import { useRealtimeSubscription } from './RealtimeContext';

// Interfaz para el frontend
export interface Planilla {
  id: string;
  sucursalOrigen: string;
  sucursalDestino?: string;
  fechaSalidaEstimada: string;
  fechaLlegadaEstimada?: string;
  camion: string;
  chofer: string;
  remitos: Remito[];
  estado: 'borrador' | 'viaje' | 'control' | 'completo' | 'incompleto';
  comentarios?: string;
  kmSalida?: number;
  kmLlegada?: number;
  createdAt: string;
  updatedAt: string;
}

// Mapper del formato backend al frontend
const mapToFrontendPlanilla = (planilla: PlanillaBackend): Planilla => ({
  id: planilla.id,
  sucursalOrigen: planilla.sucursalOrigen,
  sucursalDestino: planilla.sucursalDestino,
  fechaSalidaEstimada: planilla.fechaSalidaEstimada,
  fechaLlegadaEstimada: planilla.fechaLlegadaEstimada,
  camion: planilla.camion,
  chofer: planilla.chofer,
  remitos: planilla.remitos || [],
  estado: planilla.estado,
  comentarios: planilla.comentarios,
  kmSalida: planilla.kmSalida,
  kmLlegada: planilla.kmLlegada,
  createdAt: planilla.createdAt,
  updatedAt: planilla.updatedAt,
});

interface PlanillasContextType {
  planillas: Planilla[];
  planillasLoading: boolean;
  planillasError: string | null;
  filterEstado: string | undefined;
  setFilterEstado: (estado: string | undefined) => void;
  guardarBorrador: (planilla: Omit<Planilla, 'id' | 'createdAt' | 'updatedAt' | 'estado'>) => Promise<void>;
  actualizarPlanilla: (id: string, planilla: Partial<Planilla>) => Promise<void>;
  eliminarPlanilla: (id: string) => Promise<void>;
  confirmarViajeContext: (planillaId: string, kmSalida: number) => Promise<void>;
  confirmarLlegadaContext: (planillaId: string, kmLlegada: number) => Promise<void>;
  finalizarControlContext: (planillaId: string, remitos: Array<{
    id: string;
    bultosRecibidos: number;
    pesoTotal: number;
    direccion: string;
    whatsapp: string;
  }>) => Promise<void>;
  refreshPlanillas: () => Promise<void>;
}

const PlanillasContext = createContext<PlanillasContextType | undefined>(undefined);

export const PlanillasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [planillasLoading, setPlanillasLoading] = useState(false);
  const [planillasError, setPlanillasError] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | undefined>(undefined);

  // Cargar planillas del backend
  const refreshPlanillas = useCallback(async () => {
    setPlanillasLoading(true);
    setPlanillasError(null);
    try {
      const data = await planillaService.getAll(filterEstado);
      setPlanillas(data.map(mapToFrontendPlanilla));
    } catch (error: any) {
      console.error('Error cargando planillas:', error);
      setPlanillasError(error.message || 'Error al cargar planillas');
      setPlanillas([]);
    } finally {
      setPlanillasLoading(false);
    }
  }, [filterEstado]);

  // Cargar al iniciar y cuando cambia el filtro
  useEffect(() => {
    refreshPlanillas();
  }, [refreshPlanillas]);

  // =============================================================================
  // REALTIME: Escuchar cambios via SSE del backend
  // =============================================================================
  const { subscribe } = useRealtimeSubscription();

  useEffect(() => {
    // Suscribirse a cambios en planillas y remitos
    const unsubscribe = subscribe('planillas', (event) => {
      console.log(`🔄 [PlanillasContext] Evento ${event.action} en ${event.table}`);
      refreshPlanillas();
    });
    return () => unsubscribe();
  }, [subscribe, refreshPlanillas]);

  const guardarBorrador = async (planilla: Omit<Planilla, 'id' | 'createdAt' | 'updatedAt' | 'estado'>) => {
    try {
      const input: CreatePlanillaInput = {
        sucursalOrigen: planilla.sucursalOrigen,
        sucursalDestino: planilla.sucursalDestino,
        fechaSalidaEstimada: planilla.fechaSalidaEstimada,
        fechaLlegadaEstimada: planilla.fechaLlegadaEstimada,
        camion: planilla.camion,
        chofer: planilla.chofer,
        comentarios: planilla.comentarios,
        remitos: planilla.remitos || [],
      };
      await planillaService.create(input);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear planilla');
    }
  };

  const actualizarPlanilla = async (id: string, planilla: Partial<Planilla>) => {
    try {
      const input: UpdatePlanillaInput = {
        sucursalOrigen: planilla.sucursalOrigen,
        sucursalDestino: planilla.sucursalDestino,
        fechaSalidaEstimada: planilla.fechaSalidaEstimada,
        fechaLlegadaEstimada: planilla.fechaLlegadaEstimada,
        camion: planilla.camion,
        chofer: planilla.chofer,
        estado: planilla.estado,
        comentarios: planilla.comentarios,
        kmSalida: planilla.kmSalida,
        kmLlegada: planilla.kmLlegada,
        remitos: planilla.remitos,
      };
      await planillaService.update(id, input);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar planilla');
    }
  };

  const eliminarPlanilla = async (id: string) => {
    try {
      await planillaService.delete(id);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar planilla');
    }
  };

  const confirmarViajeContext = async (planillaId: string, kmSalida: number) => {
    try {
      await planillaService.confirmarViaje(planillaId, kmSalida);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al confirmar viaje');
    }
  };

  const confirmarLlegadaContext = async (planillaId: string, kmLlegada: number) => {
    try {
      await planillaService.confirmarLlegada(planillaId, kmLlegada);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al confirmar llegada');
    }
  };

  const finalizarControlContext = async (planillaId: string, remitos: Array<{
    id: string;
    bultosRecibidos: number;
    pesoTotal: number;
    direccion: string;
    whatsapp: string;
  }>) => {
    try {
      await planillaService.finalizarControl(planillaId, remitos);
      await refreshPlanillas();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al finalizar control');
    }
  };

  return (
    <PlanillasContext.Provider value={{ 
      planillas,
      planillasLoading,
      planillasError,
      filterEstado,
      setFilterEstado,
      guardarBorrador,
      actualizarPlanilla,
      eliminarPlanilla,
      confirmarViajeContext,
      confirmarLlegadaContext,
      finalizarControlContext,
      refreshPlanillas
    }}>
      {children}
    </PlanillasContext.Provider>
  );
};

export const usePlanillasContext = () => {
  const context = useContext(PlanillasContext);
  if (context === undefined) {
    throw new Error('usePlanillasContext must be used within a PlanillasProvider');
  }
  return context;
};
