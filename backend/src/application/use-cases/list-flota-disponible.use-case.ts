// =============================================================================
// LIST FLOTA DISPONIBLE USE CASE - BACKEND
// =============================================================================
// Application Layer - Lista unidades propias y terceros disponibles

import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';

export interface UnidadDisponible {
  id: string;
  tipoFlota: 'propia';
  label: string; // patente - marca modelo
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  estado: string;
}

export interface TerceroDisponible {
  id: string;
  tipoFlota: 'tercero';
  label: string; // razonSocial - patenteTractor
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  estado: string;
  nombreChofer?: string;
}

export type FlotaDisponible = UnidadDisponible | TerceroDisponible;

export class ListFlotaDisponibleUseCase {
  constructor(
    private unidadRepository: IUnidadRepository,
    private terceroRepository: ITerceroRepository,
  ) {}

  async execute(tipoServicio?: string): Promise<FlotaDisponible[]> {
    const unidades = await this.unidadRepository.findAll(false);
    const terceros = await this.terceroRepository.findAll(false);

    const resultado: FlotaDisponible[] = [];

    // Unidades propias disponibles
    for (const u of unidades) {
      if (u.estado === 'DISPONIBLE') {
        if (tipoServicio && u.tipoServicio !== tipoServicio) continue;
        resultado.push({
          id: u.id,
          tipoFlota: 'propia',
          label: `${u.patente} - ${u.marca} ${u.modelo}`,
          tipoServicio: u.tipoServicio,
          estado: u.estado,
        });
      }
    }

    // Terceros activos
    for (const t of terceros) {
      if (t.estado === 'activo') {
        if (tipoServicio && t.tipoServicio !== tipoServicio) continue;
        resultado.push({
          id: t.id,
          tipoFlota: 'tercero',
          label: `${t.razonSocial} - ${t.patenteTractor}`,
          tipoServicio: t.tipoServicio,
          estado: t.estado,
          nombreChofer: t.nombreChofer,
        });
      }
    }

    return resultado;
  }
}
