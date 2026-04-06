// =============================================================================
// DEPOSITO SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de depósitos del backend

import apiClient from '../api/client';

export interface Deposito {
  id: string;
  gln?: string;  // GLN - Global Location Number (GS1, 13 dígitos)
  nombre: string;
  ubicacion: string;
  capacidad: number;
  encargado?: string;
  lat?: number;
  lng?: number;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepositoInput {
  nombre: string;
  ubicacion: string;
  capacidad: number;
  encargado?: string;
  lat?: number;
  lng?: number;
  gln?: string;
}

export interface UpdateDepositoInput {
  nombre?: string;
  ubicacion?: string;
  capacidad?: number;
  encargado?: string;
  lat?: number;
  lng?: number;
  estado?: 'activo' | 'inactivo';
}

export const depositoService = {
  /**
   * Lista todos los depósitos
   * @param includeInactive - Include inactive deposits (optional)
   */
  async getAll(includeInactive: boolean = false): Promise<Deposito[]> {
    const params = includeInactive ? { incluirInactivos: 'true' } : {};
    const response = await apiClient.get('/depositos', { params });
    return response.data.data;
  },

  /**
   * Obtiene un depósito por ID
   */
  async getById(id: string): Promise<Deposito> {
    const response = await apiClient.get(`/depositos/${id}`);
    return response.data.data;
  },

  /**
   * Crea un nuevo depósito
   */
  async create(data: CreateDepositoInput): Promise<Deposito> {
    const response = await apiClient.post('/depositos', data);
    return response.data.data;
  },

  /**
   * Actualiza un depósito
   */
  async update(id: string, data: UpdateDepositoInput): Promise<Deposito> {
    const response = await apiClient.put(`/depositos/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina (soft delete) un depósito
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/depositos/${id}`);
  },
};

export default depositoService;