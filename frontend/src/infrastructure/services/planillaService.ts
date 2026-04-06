// =============================================================================
// PLANILLA SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de planillas del backend

import apiClient from '../api/client';

export interface Remito {
  id: string;
  remitente: string;
  numeroRemito: string;
  destinatario: string;
  bultos: number;
  valorDeclarado: number;
  seguimiento?: string;
  bultosRecibidos?: number;
  pesoTotal?: number;
  direccion?: string;
  whatsapp?: string;
  estado?: string;
  resultado?: string;
}

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

export interface CreatePlanillaInput {
  sucursalOrigen: string;
  sucursalDestino?: string;
  fechaSalidaEstimada: string;
  fechaLlegadaEstimada?: string;
  camion: string;
  chofer: string;
  comentarios?: string;
  remitos?: Remito[];
}

export interface UpdatePlanillaInput {
  sucursalOrigen?: string;
  sucursalDestino?: string;
  fechaSalidaEstimada?: string;
  fechaLlegadaEstimada?: string;
  camion?: string;
  chofer?: string;
  estado?: 'borrador' | 'viaje' | 'control' | 'completo' | 'incompleto';
  comentarios?: string;
  kmSalida?: number;
  kmLlegada?: number;
  remitos?: Remito[];
}

export const planillaService = {
  /**
   * Lista todas las planillas
   */
  async getAll(estado?: string): Promise<Planilla[]> {
    const params = estado ? `?estado=${estado}` : '';
    const response = await apiClient.get(`/planillas${params}`);
    return response.data.data;
  },

  /**
   * Obtiene una planilla por ID
   */
  async getById(id: string): Promise<Planilla> {
    const response = await apiClient.get(`/planillas/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva planilla
   */
  async create(data: CreatePlanillaInput): Promise<Planilla> {
    const response = await apiClient.post('/planillas', data);
    return response.data.data;
  },

  /**
   * Actualiza una planilla
   */
  async update(id: string, data: UpdatePlanillaInput): Promise<Planilla> {
    const response = await apiClient.put(`/planillas/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina una planilla
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/planillas/${id}`);
  },

  /**
   * Confirma el inicio del viaje (borrador -> viaje)
   */
  async confirmarViaje(id: string, kmSalida: number): Promise<Planilla> {
    const response = await apiClient.post(`/planillas/${id}/confirmar-viaje`, { kmSalida });
    return response.data.data;
  },

  /**
   * Confirma la llegada (viaje -> control)
   */
  async confirmarLlegada(id: string, kmLlegada: number): Promise<Planilla> {
    const response = await apiClient.post(`/planillas/${id}/confirmar-llegada`, { kmLlegada });
    return response.data.data;
  },

  /**
   * Finaliza el control de una planilla (control -> completo/incompleto)
   */
  async finalizarControl(id: string, remitos: Array<{
    id: string;
    bultosRecibidos: number;
    pesoTotal: number;
    direccion: string;
    whatsapp: string;
  }>): Promise<Planilla> {
    const response = await apiClient.post(`/planillas/${id}/finalizar-control`, { remitos });
    return response.data.data;
  },

  /**
   * Obtiene remitos por estado (Preparado, Por reasignar, etc.)
   */
  async getRemitosByEstado(estado: string): Promise<Remito[]> {
    const response = await apiClient.get(`/planillas/remitos/${estado}`);
    return response.data.data;
  },
};

export default planillaService;
