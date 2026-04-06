// =============================================================================
// CREATE PLANILLA DTO - BACKEND
// =============================================================================

import { Remito } from '../../domain/entities/planilla.entity';

export interface CreatePlanillaDto {
  sucursalOrigen: string;
  sucursalDestino?: string;
  fechaSalidaEstimada: string;
  fechaLlegadaEstimada?: string;
  camion: string;
  chofer: string;
  comentarios?: string;
  remitos?: Remito[];
}
