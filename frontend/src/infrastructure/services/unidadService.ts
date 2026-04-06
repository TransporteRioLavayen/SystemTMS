// =============================================================================
// UNIDAD SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de unidades del backend

import apiClient from '../api/client';

export interface Unidad {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  vtv?: string;
  seguro?: string;
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  estado: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnidadInput {
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  vtv?: string;
  seguro?: string;
  tipoServicio?: 'larga_distancia' | 'corta_distancia';
}

export interface UpdateUnidadInput {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  tipo?: string;
  vtv?: string;
  seguro?: string;
  tipoServicio?: 'larga_distancia' | 'corta_distancia';
  estado?: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
}

export const unidadService = {
  /**
   * Lista todas las unidades
   */
  async getAll(): Promise<Unidad[]> {
    const response = await apiClient.get('/unidades');
    return response.data.data;
  },

  /**
   * Obtiene una unidad por ID
   */
  async getById(id: string): Promise<Unidad> {
    const response = await apiClient.get(`/unidades/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva unidad
   */
  async create(data: CreateUnidadInput): Promise<Unidad> {
    const response = await apiClient.post('/unidades', data);
    return response.data.data;
  },

  /**
   * Actualiza una unidad
   */
  async update(id: string, data: UpdateUnidadInput): Promise<Unidad> {
    const response = await apiClient.put(`/unidades/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina una unidad
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/unidades/${id}`);
  },
};

export default unidadService;