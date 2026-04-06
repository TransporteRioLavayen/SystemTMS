// =============================================================================
// INICIAR TURNO USE CASE - BACKEND
// =============================================================================
// Transición: Lista para salir -> En reparto

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';

export class IniciarTurnoUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(id: string, kmSalida: number): Promise<HojaDeRuta> {
    return await this.repository.iniciarTurno(id, kmSalida);
  }
}