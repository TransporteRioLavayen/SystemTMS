// =============================================================================
// PLANILLA REPOSITORY INTERFACE - BACKEND
// =============================================================================

import { Planilla } from '../entities/planilla.entity';

export interface IPlanillaRepository {
  findAll(includeInactivos?: boolean): Promise<Planilla[]>;
  findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: Planilla[]; total: number }>;
  findById(id: string): Promise<Planilla | null>;
  findByEstado(estado: string): Promise<Planilla[]>;
  findRemitosByEstado(estado: string): Promise<Array<{
    id: string;
    remitente: string;
    numeroRemito: string;
    destinatario: string;
    bultos: number;
    valorDeclarado: number;
    seguimiento?: string;
    direccion?: string;
    whatsapp?: string;
    estado: string;
    resultado?: string;
    planillaId?: string;
  }>>;
  create(planilla: Omit<Planilla, 'id' | 'createdAt' | 'updatedAt'>): Promise<Planilla>;
  update(id: string, planilla: Partial<Planilla>): Promise<Planilla>;
  delete(id: string): Promise<void>;
  finalizarControl(id: string, remitos: Array<{
    id: string;
    bultosRecibidos: number;
    pesoTotal: number;
    direccion: string;
    whatsapp: string;
  }>): Promise<Planilla>;
  generarSeguimientoRemitos(planillaId: string): Promise<void>;
  registrarTrackingLlegada(planillaId: string): Promise<void>;
  registrarTrackingClasificacion(planillaId: string): Promise<void>;
  getTrackingByCode(trackingCode: string): Promise<Array<{
    id: string;
    remito_id: string;
    tracking_code: string;
    estado: string;
    evento: string;
    descripcion: string;
    ubicacion: string;
    created_at: string;
  }>>;
  getRemitoByTracking(trackingCode: string): Promise<{
    id: string;
    destinatario: string;
    direccion: string;
    bultos: number;
    seguimiento: string;
    estado: string;
  } | null>;
}
