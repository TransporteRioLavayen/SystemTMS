// =============================================================================
// CREATE HOJA DE RUTA USE CASE - BACKEND
// =============================================================================

import { HojaDeRuta } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';
import { CreateHojaDeRutaDto } from '../dto/create-hoja-ruta.dto';

export class CreateHojaDeRutaUseCase {
  constructor(private repository: IHojaDeRutaRepository) {}

  async execute(data: CreateHojaDeRutaDto): Promise<HojaDeRuta> {
    return await this.repository.create({
      unidad: data.unidad,
      chofer: data.chofer,
      acompanante: data.acompanante,
      depositoOrigenId: data.depositoOrigenId,
      tipoFlota: data.tipoFlota || 'propia',
      tipoServicio: data.tipoServicio || 'corta_distancia',
      cargas: data.cargas || [],
      estado: 'Lista para salir',
    });
  }
}