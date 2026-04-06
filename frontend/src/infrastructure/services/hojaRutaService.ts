// =============================================================================
// HOJA DE RUTA SERVICE - FRONTEND
// =============================================================================
// Servicio para interactuar con el módulo de hojas de ruta del backend

import apiClient from '../api/client';

export interface RemitoHoja {
  id: string;
  remitoId?: string;
  cliente: string;
  direccion: string;
  whatsapp?: string;
  bultos: number;
  estado: 'En Base' | 'En reparto' | 'Entregado' | 'Rechazado';
  motivoRechazo?: string;
  notasRechazo?: string;
}

export interface HojaDeRuta {
  id: string;
  sscc?: string;  // SSCC - Serial Shipping Container Code (GS1, 18 dígitos)
  unidad: string;
  chofer: string;
  acompanante?: string;
  depositoOrigenId?: string;
  tipoFlota: 'propia' | 'tercero';
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  cargas?: RemitoHoja[];
  fechaCreacion: string;
  estado: 'Lista para salir' | 'En reparto' | 'Finalizó reparto' | 'Unidad libre' | 'Completada';
  kmSalida?: number;
  kmLlegada?: number;
}

export interface CreateHojaDeRutaInput {
  unidad: string;
  chofer: string;
  acompanante?: string;
  depositoOrigenId?: string;
  tipoFlota?: 'propia' | 'tercero';
  tipoServicio?: 'larga_distancia' | 'corta_distancia';
  cargas?: Array<{
    remitoId?: string;
    cliente: string;
    direccion: string;
    whatsapp?: string;
    bultos: number;
  }>;
}

export interface FlotaDisponible {
  id: string;
  tipoFlota: 'propia' | 'tercero';
  label: string;
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  estado: string;
  nombreChofer?: string;
}

export const hojaRutaService = {
  /**
   * Lista todas las hojas de ruta
   */
  async getAll(estado?: string): Promise<HojaDeRuta[]> {
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    const response = await apiClient.get(`/hojas-ruta${params}`);
    return response.data.data;
  },

  /**
   * Obtiene una hoja de ruta por ID
   */
  async getById(id: string): Promise<HojaDeRuta> {
    const response = await apiClient.get(`/hojas-ruta/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva hoja de ruta
   */
  async create(data: CreateHojaDeRutaInput): Promise<HojaDeRuta> {
    const response = await apiClient.post('/hojas-ruta', data);
    return response.data.data;
  },

  /**
   * Actualiza una hoja de ruta
   */
  async update(id: string, data: Partial<HojaDeRuta>): Promise<HojaDeRuta> {
    const response = await apiClient.put(`/hojas-ruta/${id}`, data);
    return response.data.data;
  },

  /**
   * Inicia el turno de una hoja de ruta (Lista para salir -> En reparto)
   */
  async iniciarTurno(id: string, kmSalida: number): Promise<HojaDeRuta> {
    const response = await apiClient.post(`/hojas-ruta/${id}/iniciar-turno`, { kmSalida });
    return response.data.data;
  },

  /**
   * Termina el turno de una hoja de ruta (En reparto -> Unidad libre)
   */
  async terminarTurno(id: string, kmLlegada: number): Promise<HojaDeRuta> {
    const response = await apiClient.post(`/hojas-ruta/${id}/terminar-turno`, { kmLlegada });
    return response.data.data;
  },

  /**
   * Agrega una carga a la hoja de ruta
   */
  async agregarCarga(hojaId: string, carga: {
    remitoId: string;
    cliente: string;
    direccion: string;
    whatsapp?: string;
    bultos: number;
  }): Promise<HojaDeRuta> {
    const response = await apiClient.post(`/hojas-ruta/${hojaId}/agregar-carga`, carga);
    return response.data.data;
  },

  /**
   * Actualiza el estado de un remito en la hoja de ruta
   */
  async actualizarEstadoRemito(hojaId: string, remitoId: string, estado: string, motivoRechazo?: string, notasRechazo?: string): Promise<HojaDeRuta> {
    const response = await apiClient.patch(`/hojas-ruta/${hojaId}/remitos/${remitoId}/estado`, { estado, motivoRechazo, notasRechazo });
    return response.data.data;
  },

  /**
   * Obtiene las hojas de ruta de un chofer por su DNI
   */
  async findByChoferDni(dni: string): Promise<HojaDeRuta[]> {
    const response = await apiClient.get(`/hojas-ruta/chofer/${dni}`);
    return response.data.data;
  },

  /**
   * Confirma una hoja de ruta como completada
   */
  async confirmarCompletada(hojaId: string): Promise<HojaDeRuta> {
    const response = await apiClient.patch(`/hojas-ruta/${hojaId}/confirmar-completada`, {});
    return response.data.data;
  },

  /**
   * Lista unidades propias y terceros disponibles para crear hojas de ruta
   */
  async getFlotaDisponible(tipoServicio?: string): Promise<FlotaDisponible[]> {
    const params = tipoServicio ? `?tipoServicio=${encodeURIComponent(tipoServicio)}` : '';
    const response = await apiClient.get(`/hojas-ruta/flota-disponible${params}`);
    return response.data.data;
  },
};

export default hojaRutaService;