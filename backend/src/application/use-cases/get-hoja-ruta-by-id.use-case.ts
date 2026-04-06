// =============================================================================
// GET HOJA DE RUTA BY ID USE CASE - BACKEND
// =============================================================================

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';

export class GetHojaDeRutaByIdUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(id: string): Promise<HojaDeRuta> {
    const hoja = await this.repository.findById(id);
    if (!hoja) {
      throw new Error('Hoja de ruta no encontrada');
    }
    return hoja;
  }
}