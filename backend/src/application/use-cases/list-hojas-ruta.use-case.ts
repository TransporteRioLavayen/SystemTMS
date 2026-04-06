// =============================================================================
// LIST HOJAS DE RUTA USE CASE - BACKEND
// =============================================================================

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';

export class ListHojasDeRutaUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(estado?: string): Promise<HojaDeRuta[]> {
    return await this.repository.findAll(estado);
  }

  async executePaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: HojaDeRuta[]; total: number }> {
    return await this.repository.findAllPaginated(options);
  }
}