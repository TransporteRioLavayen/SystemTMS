// =============================================================================
// CREATE PLANILLA USE CASE - BACKEND
// =============================================================================

import { CreatePlanillaDto } from '../dto/create-planilla.dto';
import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';

export class CreatePlanillaUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(dto: CreatePlanillaDto): Promise<Planilla> {
    const planilla = await this.repository.create({
      sucursalOrigen: dto.sucursalOrigen,
      sucursalDestino: dto.sucursalDestino,
      fechaSalidaEstimada: dto.fechaSalidaEstimada,
      fechaLlegadaEstimada: dto.fechaLlegadaEstimada || '',
      camion: dto.camion,
      chofer: dto.chofer,
      estado: 'borrador',
      comentarios: dto.comentarios,
      remitos: dto.remitos || [],
    });

    return planilla;
  }
}
