// =============================================================================
// TERCEROS CONTEXT - FRONTEND
// =============================================================================
// Context para gestionar terceros con cache en memoria
// Sigue el mismo patrón que FlotaContext para consistencia

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { terceroService, Tercero as TerceroBackend, CreateTerceroInput, UpdateTerceroInput } from '../../infrastructure/services/terceroService';

// Interfaz para el frontend
export interface Tercero {
  id: string;
  // Datos del titular/empresa
  razonSocial: string;
  tipoDocumento: 'CUIT' | 'DNI' | 'CUIL';
  numeroDocumento: string;
  telefono?: string;
  email?: string;
  
  // Datos del vehículo
  patenteTractor: string;
  patenteAcoplado?: string;
  tipoUnidad: 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario';
  vencimientoSeguro?: string;
  vencimientoVtv?: string;
  
  // Datos del chofer
  nombreChofer?: string;
  dniChofer?: string;
  vencimientoLicencia?: string;
  vencimientoLinti?: string;
  
  // Tipo de servicio
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  
  // Estado y metadata
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

// Mapper del formato backend al frontend
const mapToFrontendTercero = (tercero: TerceroBackend): Tercero => ({
  id: tercero.id,
  razonSocial: tercero.razonSocial,
  tipoDocumento: tercero.tipoDocumento,
  numeroDocumento: tercero.numeroDocumento,
  telefono: tercero.telefono,
  email: tercero.email,
  patenteTractor: tercero.patenteTractor,
  patenteAcoplado: tercero.patenteAcoplado,
  tipoUnidad: tercero.tipoUnidad,
  vencimientoSeguro: tercero.vencimientoSeguro,
  vencimientoVtv: tercero.vencimientoVtv,
  nombreChofer: tercero.nombreChofer,
  dniChofer: tercero.dniChofer,
  vencimientoLicencia: tercero.vencimientoLicencia,
  vencimientoLinti: tercero.vencimientoLinti,
  tipoServicio: tercero.tipoServicio || 'corta_distancia',
  estado: tercero.estado,
  createdAt: tercero.createdAt,
  updatedAt: tercero.updatedAt,
});

interface TercerosContextType {
  terceros: Tercero[];
  tercerosLoading: boolean;
  tercerosError: string | null;
  incluirInactivos: boolean;
  setIncluirInactivos: (incluir: boolean) => void;
  agregarTercero: (tercero: Omit<Tercero, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  actualizarTercero: (id: string, tercero: Partial<Tercero>) => Promise<void>;
  eliminarTercero: (id: string) => Promise<void>;
  refreshTerceros: () => Promise<void>;
}

const TercerosContext = createContext<TercerosContextType | undefined>(undefined);

export const TercerosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [tercerosLoading, setTercerosLoading] = useState(false);
  const [tercerosError, setTercerosError] = useState<string | null>(null);
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  // Cargar terceros del backend
  const refreshTerceros = useCallback(async () => {
    setTercerosLoading(true);
    setTercerosError(null);
    try {
      const data = await terceroService.getAll(incluirInactivos);
      setTerceros(data.map(mapToFrontendTercero));
    } catch (error: any) {
      console.error('Error cargando terceros:', error);
      setTercerosError(error.message || 'Error al cargar terceros');
    } finally {
      setTercerosLoading(false);
    }
  }, [incluirInactivos]);

  // Cargar al iniciar y cuando cambia el filtro
  useEffect(() => {
    refreshTerceros();
  }, [refreshTerceros]);

  const agregarTercero = async (tercero: Omit<Tercero, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const input: CreateTerceroInput = {
        razonSocial: tercero.razonSocial,
        tipoDocumento: tercero.tipoDocumento,
        numeroDocumento: tercero.numeroDocumento,
        telefono: tercero.telefono || undefined,
        email: tercero.email || undefined,
        patenteTractor: tercero.patenteTractor,
        patenteAcoplado: tercero.patenteAcoplado || undefined,
        tipoUnidad: tercero.tipoUnidad,
        vencimientoSeguro: tercero.vencimientoSeguro || undefined,
        vencimientoVtv: tercero.vencimientoVtv || undefined,
        nombreChofer: tercero.nombreChofer || undefined,
        dniChofer: tercero.dniChofer || undefined,
        vencimientoLicencia: tercero.vencimientoLicencia || undefined,
        vencimientoLinti: tercero.vencimientoLinti || undefined,
        tipoServicio: tercero.tipoServicio,
      };
      await terceroService.create(input);
      await refreshTerceros();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear tercero');
    }
  };

  const actualizarTercero = async (id: string, tercero: Partial<Tercero>) => {
    try {
      const input: UpdateTerceroInput = {
        razonSocial: tercero.razonSocial,
        tipoDocumento: tercero.tipoDocumento,
        numeroDocumento: tercero.numeroDocumento,
        telefono: tercero.telefono,
        email: tercero.email,
        patenteTractor: tercero.patenteTractor,
        patenteAcoplado: tercero.patenteAcoplado,
        tipoUnidad: tercero.tipoUnidad,
        vencimientoSeguro: tercero.vencimientoSeguro,
        vencimientoVtv: tercero.vencimientoVtv,
        nombreChofer: tercero.nombreChofer,
        dniChofer: tercero.dniChofer,
        vencimientoLicencia: tercero.vencimientoLicencia,
        vencimientoLinti: tercero.vencimientoLinti,
        tipoServicio: tercero.tipoServicio,
        estado: tercero.estado,
      };
      await terceroService.update(id, input);
      await refreshTerceros();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar tercero');
    }
  };

  const eliminarTercero = async (id: string) => {
    try {
      await terceroService.delete(id);
      await refreshTerceros();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar tercero');
    }
  };

  return (
    <TercerosContext.Provider value={{ 
      terceros,
      tercerosLoading,
      tercerosError,
      incluirInactivos,
      setIncluirInactivos,
      agregarTercero,
      actualizarTercero,
      eliminarTercero,
      refreshTerceros
    }}>
      {children}
    </TercerosContext.Provider>
  );
};

export const useTerceros = () => {
  const context = useContext(TercerosContext);
  if (context === undefined) {
    throw new Error('useTerceros must be used within a TercerosProvider');
  }
  return context;
};
