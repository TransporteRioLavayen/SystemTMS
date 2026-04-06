import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { depositoService, Deposito as DepositoBackend, CreateDepositoInput, UpdateDepositoInput } from '../../infrastructure/services/depositoService';
import { unidadService, Unidad as UnidadBackend, CreateUnidadInput, UpdateUnidadInput } from '../../infrastructure/services/unidadService';
import { choferService, Chofer as ChoferBackend, CreateChoferInput, UpdateChoferInput } from '../../infrastructure/services/choferService';
import { useRealtimeSubscription } from './RealtimeContext';

export interface Unidad {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  vtv: string;
  seguro: string;
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  estado: string;
}

export interface Chofer {
  id: string;
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
  estado: string;
}

// Interfaz compatible con el frontend actual
export interface Deposito {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: string;
  estado: string;
  encargado: string;
  lat?: number;
  lng?: number;
  gln?: string;
}

// Convertir del formato del backend al formato del frontend
const mapToFrontendDeposito = (deposito: DepositoBackend): Deposito => ({
  id: deposito.id,
  nombre: deposito.nombre,
  ubicacion: deposito.ubicacion,
  capacidad: deposito.capacidad.toString(),
  estado: deposito.estado,
  encargado: deposito.encargado || '',
  lat: deposito.lat || 0,
  lng: deposito.lng || 0,
});

const mapToFrontendUnidad = (unidad: UnidadBackend): Unidad => ({
  id: unidad.id,
  patente: unidad.patente,
  marca: unidad.marca,
  modelo: unidad.modelo,
  anio: unidad.anio,
  tipo: unidad.tipo,
  vtv: unidad.vtv || '',
  seguro: unidad.seguro || '',
  tipoServicio: unidad.tipoServicio || 'corta_distancia',
  estado: unidad.estado,
});

const mapToFrontendChofer = (chofer: ChoferBackend): Chofer => ({
  id: chofer.id,
  nombre: chofer.nombre,
  dni: chofer.dni,
  licencia: chofer.licencia,
  vencimientoLicencia: chofer.vencimientoLicencia,
  telefono: chofer.telefono,
  estado: chofer.estado,
});

interface FlotaContextType {
  unidades: Unidad[];
  unidadesLoading: boolean;
  unidadesError: string | null;
  choferes: Chofer[];
  choferesLoading: boolean;
  choferesError: string | null;
  depositos: Deposito[];
  depositosLoading: boolean;
  depositosError: string | null;
  agregarUnidad: (unidad: Omit<Unidad, 'id'>) => Promise<void>;
  actualizarUnidad: (id: string, unidad: Partial<Unidad>) => Promise<void>;
  eliminarUnidad: (id: string) => Promise<void>;
  agregarChofer: (chofer: Omit<Chofer, 'id'>) => Promise<void>;
  actualizarChofer: (id: string, chofer: Partial<Chofer>) => Promise<void>;
  eliminarChofer: (id: string) => Promise<void>;
  agregarDeposito: (deposito: Omit<Deposito, 'id'>) => Promise<void>;
  actualizarDeposito: (id: string, deposito: Omit<Deposito, 'id'>) => Promise<void>;
  eliminarDeposito: (id: string) => Promise<void>;
  refreshDepositos: () => Promise<void>;
  refreshUnidades: () => Promise<void>;
  refreshChoferes: () => Promise<void>;
}

const FlotaContext = createContext<FlotaContextType | undefined>(undefined);

export const FlotaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [unidadesError, setUnidadesError] = useState<string | null>(null);
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [choferesLoading, setChoferesLoading] = useState(false);
  const [choferesError, setChoferesError] = useState<string | null>(null);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [depositosLoading, setDepositosLoading] = useState(false);
  const [depositosError, setDepositosError] = useState<string | null>(null);

  // Cargar depósitos del backend
  const refreshDepositos = useCallback(async () => {
    setDepositosLoading(true);
    setDepositosError(null);
    try {
      const data = await depositoService.getAll();
      setDepositos(data.map(mapToFrontendDeposito));
    } catch (error: any) {
      console.error('Error cargando depósitos:', error);
      setDepositosError(error.message || 'Error al cargar depósitos');
      setDepositos([]);
    } finally {
      setDepositosLoading(false);
    }
  }, []);

  // Cargar unidades del backend
  const refreshUnidades = useCallback(async () => {
    setUnidadesLoading(true);
    setUnidadesError(null);
    try {
      const data = await unidadService.getAll();
      setUnidades(data.map(mapToFrontendUnidad));
    } catch (error: any) {
      console.error('Error cargando unidades:', error);
      setUnidadesError(error.message || 'Error al cargar unidades');
      setUnidades([]);
    } finally {
      setUnidadesLoading(false);
    }
  }, [])

  // Cargar choferes del backend
  const refreshChoferes = useCallback(async () => {
    setChoferesLoading(true);
    setChoferesError(null);
    try {
      const data = await choferService.getAll();
      setChoferes(data.map(mapToFrontendChofer));
    } catch (error: any) {
      console.error('Error cargando choferes:', error);
      setChoferesError(error.message || 'Error al cargar choferes');
      setChoferes([]);
    } finally {
      setChoferesLoading(false);
    }
  }, []);

  // Cargar todo al iniciar
  useEffect(() => {
    refreshDepositos();
    refreshUnidades();
    refreshChoferes();
  }, [refreshDepositos, refreshUnidades, refreshChoferes]);

  // =============================================================================
  // REALTIME: Escuchar cambios via SSE del backend
  // =============================================================================
  const { subscribe } = useRealtimeSubscription();

  useEffect(() => {
    // Suscribirse a cambios en flota
    const unsubscribe = subscribe('flota', (event) => {
      console.log(`🔄 [FlotaContext] Evento ${event.action} en ${event.table}`);
      if (event.table === 'choferes') refreshChoferes();
      else if (event.table === 'unidades') refreshUnidades();
      else if (event.table === 'depositos') refreshDepositos();
    });
    return () => unsubscribe();
  }, [subscribe, refreshChoferes, refreshUnidades, refreshDepositos]);

  const agregarUnidad = async (unidad: Omit<Unidad, 'id'>) => {
    try {
      const input: CreateUnidadInput = {
        patente: unidad.patente,
        marca: unidad.marca,
        modelo: unidad.modelo,
        anio: unidad.anio,
        tipo: unidad.tipo,
        vtv: unidad.vtv || undefined,
        seguro: unidad.seguro || undefined,
        tipoServicio: unidad.tipoServicio as 'larga_distancia' | 'corta_distancia' | undefined,
      };
      await unidadService.create(input);
      await refreshUnidades();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear unidad');
    }
  };

  const actualizarUnidad = async (id: string, unidad: Partial<Unidad>) => {
    try {
      const input: UpdateUnidadInput = {
        patente: unidad.patente,
        marca: unidad.marca,
        modelo: unidad.modelo,
        anio: unidad.anio,
        vtv: unidad.vtv,
        seguro: unidad.seguro,
        tipoServicio: unidad.tipoServicio as 'larga_distancia' | 'corta_distancia' | undefined,
        estado: unidad.estado as 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO',
      };
      await unidadService.update(id, input);
      await refreshUnidades();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar unidad');
    }
  };

  const eliminarUnidad = async (id: string) => {
    try {
      await unidadService.delete(id);
      await refreshUnidades();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar unidad');
    }
  };

  const agregarChofer = async (chofer: Omit<Chofer, 'id'>) => {
    try {
      const input: CreateChoferInput = {
        nombre: chofer.nombre,
        dni: chofer.dni,
        licencia: chofer.licencia,
        vencimientoLicencia: chofer.vencimientoLicencia,
        telefono: chofer.telefono,
      };
      await choferService.create(input);
      await refreshChoferes();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear chofer');
    }
  };

  const actualizarChofer = async (id: string, chofer: Partial<Chofer>) => {
    try {
      const input: UpdateChoferInput = {
        nombre: chofer.nombre,
        dni: chofer.dni,
        licencia: chofer.licencia,
        vencimientoLicencia: chofer.vencimientoLicencia,
        telefono: chofer.telefono,
        estado: chofer.estado as 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO',
      };
      await choferService.update(id, input);
      await refreshChoferes();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar chofer');
    }
  };

  const eliminarChofer = async (id: string) => {
    try {
      await choferService.delete(id);
      await refreshChoferes();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar chofer');
    }
  };

  const agregarDeposito = async (deposito: Omit<Deposito, 'id'>) => {
    try {
      const input: CreateDepositoInput = {
        nombre: deposito.nombre,
        ubicacion: deposito.ubicacion,
        capacidad: parseInt(deposito.capacidad) || 0,
        encargado: deposito.encargado || undefined,
        lat: deposito.lat || undefined,
        lng: deposito.lng || undefined,
      };
      await depositoService.create(input);
      await refreshDepositos();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear depósito');
    }
  };

  const actualizarDeposito = async (id: string, deposito: Omit<Deposito, 'id'>) => {
    try {
      const input: UpdateDepositoInput = {
        nombre: deposito.nombre,
        ubicacion: deposito.ubicacion,
        capacidad: parseInt(deposito.capacidad) || undefined,
        encargado: deposito.encargado || undefined,
        lat: deposito.lat || undefined,
        lng: deposito.lng || undefined,
      };
      await depositoService.update(id, input);
      await refreshDepositos();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar depósito');
    }
  };

  const eliminarDeposito = async (id: string) => {
    try {
      await depositoService.delete(id);
      await refreshDepositos();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar depósito');
    }
  };

  return (
    <FlotaContext.Provider value={{ 
      unidades,
      unidadesLoading,
      unidadesError,
      choferes,
      choferesLoading,
      choferesError,
      depositos,
      depositosLoading,
      depositosError,
      agregarUnidad,
      actualizarUnidad,
      eliminarUnidad,
      agregarChofer,
      actualizarChofer,
      eliminarChofer,
      agregarDeposito, 
      actualizarDeposito, 
      eliminarDeposito,
      refreshDepositos,
      refreshUnidades,
      refreshChoferes
    }}>
      {children}
    </FlotaContext.Provider>
  );
};

export const useFlota = () => {
  const context = useContext(FlotaContext);
  if (context === undefined) {
    throw new Error('useFlota must be used within a FlotaProvider');
  }
  return context;
};