// =============================================================================
// HOJAS DE RUTA CONTEXT - FRONTEND
// =============================================================================
// Context para gestionar hojas de ruta con backend integration

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import hojaRutaService, { HojaDeRuta as HojaDeRutaBackend, RemitoHoja } from '../../infrastructure/services/hojaRutaService';
import { useRealtimeSubscription } from './RealtimeContext';

// Interfaz para el frontend
export interface Remito {
  id: string;
  remitoId?: string;
  cliente: string;
  direccion: string;
  whatsapp?: string;
  bultos: number;
  estado: 'En Base' | 'En reparto' | 'Entregado' | 'Rechazado';
}

export interface HojaDeRuta {
  id: string;
  sscc?: string;  // SSCC - Serial Shipping Container Code (GS1)
  unidad: string;
  chofer: string;
  acompanante?: string;
  depositoOrigenId?: string;
  tipoFlota: 'propia' | 'tercero';
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  cargas: Remito[];
  fechaCreacion: Date;
  estado: 'Lista para salir' | 'En reparto' | 'Finalizó reparto' | 'Unidad libre' | 'Completada';
  kmSalida?: string;
  kmLlegada?: string;
}

// Mapper del formato backend al frontend
const mapToFrontend = (hoja: HojaDeRutaBackend): HojaDeRuta => ({
  id: hoja.id,
  sscc: hoja.sscc,  // SSCC viene de la DB
  unidad: hoja.unidad,
  chofer: hoja.chofer,
  acompanante: hoja.acompanante,
  depositoOrigenId: hoja.depositoOrigenId,
  tipoFlota: hoja.tipoFlota || 'propia',
  tipoServicio: hoja.tipoServicio || 'corta_distancia',
  cargas: (hoja.cargas || []).map(r => ({
    id: r.id,
    remitoId: r.remitoId,
    cliente: r.cliente,
    direccion: r.direccion,
    whatsapp: r.whatsapp,
    bultos: r.bultos,
    estado: r.estado,
  })),
  fechaCreacion: new Date(hoja.fechaCreacion),
  estado: hoja.estado,
  kmSalida: hoja.kmSalida?.toString(),
  kmLlegada: hoja.kmLlegada?.toString(),
});

interface HojasDeRutaContextType {
  hojasDeRuta: HojaDeRuta[];
  loading: boolean;
  error: string | null;
  refreshHojas: () => Promise<void>;
  agregarHoja: (data: { unidad: string; chofer: string; acompanante?: string; depositoOrigenId?: string; tipoFlota?: 'propia' | 'tercero'; tipoServicio?: 'larga_distancia' | 'corta_distancia'; cargas?: Array<{ remitoId: string; cliente: string; direccion: string; whatsapp?: string; bultos: number }> }) => Promise<void>;
  iniciarTurno: (hojaId: string, kmSalida: number) => Promise<void>;
  terminarTurno: (hojaId: string, kmLlegada: number) => Promise<void>;
  actualizarEstadoRemito: (hojaId: string, remitoId: string, nuevoEstado: string) => Promise<void>;
  confirmarHojaCompletada: (hojaId: string) => Promise<void>;
}

const HojasDeRutaContext = createContext<HojasDeRutaContextType | undefined>(undefined);

export const HojasDeRutaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hojasDeRuta, setHojasDeRuta] = useState<HojaDeRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHojas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hojaRutaService.getAll();
      if (!Array.isArray(data)) {
        console.warn('Data returned is not an array:', data);
        setHojasDeRuta([]);
      } else {
        setHojasDeRuta(data.map(mapToFrontend));
      }
    } catch (err: any) {
      console.error('Error loading hojas de ruta:', err);
      setError(err.message || 'Error al cargar hojas de ruta');
      setHojasDeRuta([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al iniciar
  useEffect(() => {
    refreshHojas();
  }, [refreshHojas]);

  // =============================================================================
  // REALTIME: Escuchar cambios via SSE del backend
  // =============================================================================
  const { subscribe } = useRealtimeSubscription();

  useEffect(() => {
    // Suscribirse a cambios en hojas de ruta
    const unsubscribe = subscribe('hojas', (event) => {
      console.log(`🔄 [HojasDeRutaContext] Evento ${event.action} en ${event.table}`);
      refreshHojas();
    });
    return () => unsubscribe();
  }, [subscribe, refreshHojas]);

  // =============================================================================
  // AGREGAR HOJA DE RUTA
  // =============================================================================
  const agregarHoja = async (data: { unidad: string; chofer: string; acompanante?: string; depositoOrigenId?: string; tipoFlota?: 'propia' | 'tercero'; tipoServicio?: 'larga_distancia' | 'corta_distancia'; cargas?: Array<{ remitoId: string; cliente: string; direccion: string; whatsapp?: string; bultos: number }> }) => {
    try {
      await hojaRutaService.create(data);
      // Usar refreshHojas en vez de agregar manualmente al estado
      // para evitar duplicación por race condition con realtime
      await refreshHojas();
    } catch (err: any) {
      console.error('Error agregarHoja:', err);
      const message = err.response?.data?.message || err.message || 'Error al crear hoja de ruta';
      setError(message);
      throw new Error(message);
    }
  };

  // =============================================================================
  // INICIAR TURNO
  // =============================================================================
  const iniciarTurno = async (hojaId: string, kmSalida: number) => {
    try {
      const actualizada = await hojaRutaService.iniciarTurno(hojaId, kmSalida);
      setHojasDeRuta(prev => prev.map(h => h.id === hojaId ? mapToFrontend(actualizada) : h));
    } catch (err: any) {
      console.error('Error iniciarTurno:', err);
      const message = err.response?.data?.message || err.message || 'Error al iniciar turno';
      setError(message);
      throw new Error(message);
    }
  };

  // =============================================================================
  // TERMINAR TURNO
  // =============================================================================
  const terminarTurno = async (hojaId: string, kmLlegada: number) => {
    try {
      const actualizada = await hojaRutaService.terminarTurno(hojaId, kmLlegada);
      setHojasDeRuta(prev => prev.map(h => h.id === hojaId ? mapToFrontend(actualizada) : h));
    } catch (err: any) {
      console.error('Error terminarTurno:', err);
      const message = err.response?.data?.message || err.message || 'Error al terminar turno';
      setError(message);
      throw new Error(message);
    }
  };

  // =============================================================================
  // ACTUALIZAR ESTADO REMITO
  // =============================================================================
  const actualizarEstadoRemito = async (hojaId: string, remitoId: string, nuevoEstado: string) => {
    try {
      const actualizada = await hojaRutaService.actualizarEstadoRemito(hojaId, remitoId, nuevoEstado);
      setHojasDeRuta(prev => prev.map(h => h.id === hojaId ? mapToFrontend(actualizada) : h));
    } catch (err: any) {
      console.error('Error actualizarEstadoRemito:', err);
      const message = err.response?.data?.message || err.message || 'Error al actualizar estado del remito';
      setError(message);
      throw new Error(message);
    }
  };

  // =============================================================================
  // CONFIRMAR HOJA COMPLETADA
  // =============================================================================
  const confirmarHojaCompletada = async (hojaId: string) => {
    try {
      const actualizada = await hojaRutaService.confirmarCompletada(hojaId);
      setHojasDeRuta(prev => prev.map(h => h.id === hojaId ? mapToFrontend(actualizada) : h));
    } catch (err: any) {
      console.error('Error confirmarHojaCompletada:', err);
      const message = err.response?.data?.message || err.message || 'Error al confirmar hoja como completada';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <HojasDeRutaContext.Provider value={{ 
      hojasDeRuta, 
      loading, 
      error,
      refreshHojas,
      agregarHoja, 
      iniciarTurno, 
      terminarTurno, 
      actualizarEstadoRemito,
      confirmarHojaCompletada
    }}>
      {children}
    </HojasDeRutaContext.Provider>
  );
};

export const useHojasDeRuta = () => {
  const context = useContext(HojasDeRutaContext);
  if (context === undefined) {
    throw new Error('useHojasDeRuta must be used within a HojasDeRutaProvider');
  }
  return context;
};