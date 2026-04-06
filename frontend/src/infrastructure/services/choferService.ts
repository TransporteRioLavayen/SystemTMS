// =============================================================================
// CHOFER SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de choferes del backend

import apiClient from '../api/client';

export interface Chofer {
  id: string;
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
  estado: 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO';
  createdAt: string;
  updatedAt: string;
}

export interface CreateChoferInput {
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
}

export interface UpdateChoferInput {
  nombre?: string;
  dni?: string;
  licencia?: string;
  vencimientoLicencia?: string;
  telefono?: string;
  estado?: 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO';
}

export const choferService = {
  /**
   * Lista todos los choferes
   */
  async getAll(): Promise<Chofer[]> {
    const response = await apiClient.get('/choferes');
    return response.data.data;
  },

  /**
   * Obtiene un chofer por ID
   */
  async getById(id: string): Promise<Chofer> {
    const response = await apiClient.get(`/choferes/${id}`);
    return response.data.data;
  },

  /**
   * Crea un nuevo chofer
   */
  async create(data: CreateChoferInput): Promise<Chofer> {
    const response = await apiClient.post('/choferes', data);
    return response.data.data;
  },

  /**
   * Actualiza un chofer
   */
  async update(id: string, data: UpdateChoferInput): Promise<Chofer> {
    const response = await apiClient.put(`/choferes/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina un chofer
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/choferes/${id}`);
  },
};

export default choferService;