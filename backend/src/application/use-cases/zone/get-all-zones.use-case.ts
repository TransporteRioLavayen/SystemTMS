// =============================================================================
// USE CASE: Get All Zones
// =============================================================================
// Application Layer

import { Zone } from '../../../domain/entities/zone.entity';
import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';

export class GetAllZonesUseCase {
  constructor(private zoneRepository: IZoneRepository) {}

  async execute(filters?: { estado?: 'activo' | 'inactivo' }): Promise<Zone[]> {
    return this.zoneRepository.findAll(filters);
  }
}
