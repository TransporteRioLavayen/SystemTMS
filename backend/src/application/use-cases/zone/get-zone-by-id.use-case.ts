// =============================================================================
// USE CASE: Get Zone By ID
// =============================================================================
// Application Layer

import { Zone } from '../../../domain/entities/zone.entity';
import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';

export class GetZoneByIdUseCase {
  constructor(private zoneRepository: IZoneRepository) {}

  async execute(id: string): Promise<Zone | null> {
    return this.zoneRepository.findById(id);
  }
}
