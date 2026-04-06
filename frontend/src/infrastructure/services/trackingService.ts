// =============================================================================
// TRACKING SERVICE - FRONTEND
// =============================================================================
// Servicio para consultar el tracking de envíos

import apiClient from '../api/client';

export interface TrackingEvent {
  id: string;
  remito_id: string;
  tracking_code: string;
  estado: string;
  evento: string;
  descripcion: string;
  ubicacion: string;
  created_at: string;
}

export interface TrackingRemito {
  id: string;
  destinatario: string;
  direccion: string;
  bultos: number;
  seguimiento: string;
  estado: string;
  // Estado derivado del último evento de tracking
  estadoActual: string;
}

export interface TrackingResponse {
  remito: TrackingRemito;
  events: TrackingEvent[];
}

export const trackingService = {
  /**
   * Consulta el tracking de un envío por código
   */
  async getByCode(trackingCode: string): Promise<TrackingResponse> {
    const response = await apiClient.get(`/planillas/tracking/${trackingCode}`);
    return response.data.data;
  },
};

export default trackingService;
