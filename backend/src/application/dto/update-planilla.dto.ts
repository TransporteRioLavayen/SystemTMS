// =============================================================================
// UPDATE PLANILLA DTO - BACKEND
// =============================================================================

import { Remito } from '../../domain/entities/planilla.entity';

export interface UpdatePlanillaDto {
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
