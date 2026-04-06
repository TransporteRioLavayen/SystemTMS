// =============================================================================
// TERCERO SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de terceros del backend

import apiClient from '../api/client';

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

export interface CreateTerceroInput {
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
  tipoServicio?: 'larga_distancia' | 'corta_distancia';
}

export interface UpdateTerceroInput {
  // Datos del titular/empresa
  razonSocial?: string;
  tipoDocumento?: 'CUIT' | 'DNI' | 'CUIL';
  numeroDocumento?: string;
  telefono?: string;
  email?: string;
  
  // Datos del vehículo
  patenteTractor?: string;
  patenteAcoplado?: string;
  tipoUnidad?: 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario';
  vencimientoSeguro?: string;
  vencimientoVtv?: string;
  
  // Datos del chofer
  nombreChofer?: string;
  dniChofer?: string;
  vencimientoLicencia?: string;
  vencimientoLinti?: string;
  
  // Tipo de servicio
  tipoServicio?: 'larga_distancia' | 'corta_distancia';
  
  // Estado
  estado?: 'activo' | 'inactivo';
}

export const terceroService = {
  /**
   * Lista todos los terceros
   */
  async getAll(includeInactive: boolean = false): Promise<Tercero[]> {
    const params = includeInactive ? '?incluirInactivos=true' : '';
    const response = await apiClient.get(`/terceros${params}`);
    return response.data.data;
  },

  /**
   * Obtiene un tercero por ID
   */
  async getById(id: string): Promise<Tercero> {
    const response = await apiClient.get(`/terceros/${id}`);
    return response.data.data;
  },

  /**
   * Crea un nuevo tercero
   */
  async create(data: CreateTerceroInput): Promise<Tercero> {
    const response = await apiClient.post('/terceros', data);
    return response.data.data;
  },

  /**
   * Actualiza un tercero
   */
  async update(id: string, data: UpdateTerceroInput): Promise<Tercero> {
    const response = await apiClient.put(`/terceros/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina un tercero
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/terceros/${id}`);
  },
};

export default terceroService;