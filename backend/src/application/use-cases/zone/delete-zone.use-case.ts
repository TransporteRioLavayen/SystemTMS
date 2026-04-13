// =============================================================================
// USE CASE: Delete Zone
// =============================================================================
// Application Layer

import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';

export class DeleteZoneUseCase {
  constructor(private zoneRepository: IZoneRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    const existingZone = await this.zoneRepository.findById(id);
    if (!existingZone) {
      throw new Error(`Zone with id ${id} not found`);
    }

    // Eliminar
    await this.zoneRepository.delete(id);
  }
}
