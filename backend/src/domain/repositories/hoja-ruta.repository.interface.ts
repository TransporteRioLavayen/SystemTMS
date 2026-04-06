// =============================================================================
// HOJA DE RUTA REPOSITORY INTERFACE - BACKEND
// =============================================================================

import { HojaDeRuta } from '../entities/hoja-ruta.entity';

export interface IHojaDeRutaRepository {
  findAll(estado?: string): Promise<HojaDeRuta[]>;
  findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: HojaDeRuta[]; total: number }>;
  findById(id: string): Promise<HojaDeRuta | null>;
  create(hoja: Omit<HojaDeRuta, 'id' | 'createdAt' | 'updatedAt'>): Promise<HojaDeRuta>;
  update(id: string, hoja: Partial<HojaDeRuta>): Promise<HojaDeRuta>;
  delete(id: string): Promise<void>;
  agregarCarga(hojaId: string, carga: {
    remitoId: string;
    cliente: string;
    direccion: string;
    whatsapp?: string;
    bultos: number;
  }): Promise<HojaDeRuta>;
  actualizarEstadoRemito(hojaId: string, remitoId: string, estado: string, motivoRechazo?: string, notasRechazo?: string): Promise<HojaDeRuta>;
  findByChoferDni(dni: string): Promise<HojaDeRuta[]>;
  iniciarTurno(hojaId: string, kmSalida: number): Promise<HojaDeRuta>;
  terminarTurno(hojaId: string, kmLlegada: number): Promise<HojaDeRuta>;
  confirmarCompletada(hojaId: string): Promise<HojaDeRuta>;
}