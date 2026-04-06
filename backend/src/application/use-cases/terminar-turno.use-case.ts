// =============================================================================
// TERMINAR TURNO USE CASE - BACKEND
// =============================================================================
// Transición: En reparto -> Unidad libre

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';

export class TerminarTurnoUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(id: string, kmLlegada: number): Promise<HojaDeRuta> {
    return await this.repository.terminarTurno(id, kmLlegada);
  }
}