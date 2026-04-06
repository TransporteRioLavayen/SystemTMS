// =============================================================================
// UPDATE HOJA DE RUTA USE CASE - BACKEND
// =============================================================================

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';

export class UpdateHojaDeRutaUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(id: string, data: Partial<HojaDeRuta>): Promise<HojaDeRuta> {
    const hoja = await this.repository.findById(id);
    if (!hoja) {
      throw new Error('Hoja de ruta no encontrada');
    }
    return await this.repository.update(id, data);
  }
}