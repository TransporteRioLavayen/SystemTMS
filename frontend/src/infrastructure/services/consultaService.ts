// =============================================================================
// CONSULTA SERVICE - INFRASTRUCTURE
// =============================================================================
// Servicio para gestionar consultas desde la landing page y el panel admin

import apiClient from '../api/client';

export type ConsultaTipo = 'reclamos' | 'alquiler_unidades' | 'cargas_especiales' | 'cargas_internacionales' | 'otro';
export type ConsultaEstado = 'pendiente' | 'en_proceso' | 'respondida' | 'cerrada';

export interface Consulta {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  tipoConsulta: ConsultaTipo;
  mensaje: string;
  estado: ConsultaEstado;
  respuesta?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultaInput {
  nombre: string;
  email: string;
  telefono?: string;
  tipoConsulta: ConsultaTipo;
  mensaje: string;
}

export interface UpdateConsultaInput {
  estado?: ConsultaEstado;
  respuesta?: string;
}

export const consultaService = {
  /**
   * Crear una consulta desde la landing page (público, sin autenticación)
   */
  async createConsulta(data: CreateConsultaInput): Promise<Consulta> {
    const response = await apiClient.post('/consultas', data);
    return response.data.data;
  },

  /**
   * Listar todas las consultas (solo ADMIN)
   */
  async listConsultas(page: number = 1, limit: number = 20, estado?: ConsultaEstado): Promise<{
    data: Consulta[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (estado) {
      params.append('estado', estado);
    }

    const response = await apiClient.get(`/consultas?${params.toString()}`);
    return response.data;
  },

  /**
   * Actualizar una consulta (estado/respuesta) - solo ADMIN
   */
  async updateConsulta(id: string, data: UpdateConsultaInput): Promise<Consulta> {
    const response = await apiClient.patch(`/consultas/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar una consulta - solo ADMIN
   */
  async deleteConsulta(id: string): Promise<void> {
    await apiClient.delete(`/consultas/${id}`);
  },
};

export default consultaService;
