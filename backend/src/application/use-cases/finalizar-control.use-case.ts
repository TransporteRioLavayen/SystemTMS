// =============================================================================
// FINALIZAR CONTROL USE CASE - BACKEND
// =============================================================================
// Transición: control -> completo/incompleto
// Actualiza los remitos con datos de control (bultos recibidos, peso, dirección, whatsapp)
// y determina el estado final según si hay diferencias de bultos

import { Planilla } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';
import { FinalizarControlDto } from '../dto/finalizar-control.dto';

export class FinalizarControlUseCase {
  constructor(private repository: IPlanillaRepository) {}

  async execute(id: string, data: FinalizarControlDto): Promise<Planilla> {
    // Validar que la planilla existe y está en estado 'control'
    const planilla = await this.repository.findById(id);
    if (!planilla) {
      throw new Error('Planilla no encontrada');
    }

    if (planilla.estado !== 'control') {
      throw new Error('La planilla debe estar en estado "control" para finalizar el control');
    }

    // Validar que los remitos coincidan con los de la planilla
    if (planilla.remitos.length !== data.remitos.length) {
      throw new Error('La cantidad de remitos no coincide con los de la planilla');
    }

    // Validar que todos los IDs de remitos existan en la planilla
    const remitosIds = planilla.remitos.map(r => r.id);
    for (const remito of data.remitos) {
      if (!remitosIds.includes(remito.id)) {
        throw new Error(`Remito ${remito.id} no encontrado en la planilla`);
      }
    }

    // Llamar al repository para finalizar el control
    const result = await this.repository.finalizarControl(id, data.remitos);

    return result;
  }
}