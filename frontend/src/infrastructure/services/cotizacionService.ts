// =============================================================================
// COTIZACION SERVICE - INFRASTRUCTURE
// =============================================================================
// Servicio para gestionar cotizaciones desde la landing page

import apiClient from '../api/client';

export interface Cotizacion {
  id: string;
  depositoOrigen: string;
  zonaDestino: number;
  localidadDestino: string;
  tipoCarga: string;
  cantidad: number;
  valorDeclarado: number;
  incluirIva: boolean;
  entregaDomicilio: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCotizacionInput {
  depositoOrigen: string;
  zonaDestino: number;
  localidadDestino: string;
  tipoCarga: string;
  cantidad: number;
  valorDeclarado: number;
  incluirIva: boolean;
  entregaDomicilio: boolean;
}

export const cotizacionService = {
  /**
   * Crear una cotización desde la landing page (público, sin autenticación)
   * Se guarda en la base de datos antes de abrir WhatsApp
   */
  async createCotizacion(data: CreateCotizacionInput): Promise<Cotizacion> {
    const response = await apiClient.post('/cotizaciones', data);
    return response.data.data;
  },
};

export default cotizacionService;