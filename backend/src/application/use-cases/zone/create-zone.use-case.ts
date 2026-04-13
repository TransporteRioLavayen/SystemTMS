// =============================================================================
// USE CASE: Create Zone
// =============================================================================
// Application Layer

import { Zone, CreateZoneInput, createZoneEntity } from '../../../domain/entities/zone.entity';
import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';

export class CreateZoneUseCase {
  constructor(private zoneRepository: IZoneRepository) {}

  async execute(input: CreateZoneInput): Promise<Zone> {
    // Validar que el número de zona no exista
    const existingZone = await this.zoneRepository.findByNumero(input.numero);
    if (existingZone) {
      throw new Error(`Zone with numero ${input.numero} already exists`);
    }

    // Crear la zona
    const zone = createZoneEntity({
      id: crypto.randomUUID ? crypto.randomUUID() : `zone-${Date.now()}`,
      ...input,
    });

    return this.zoneRepository.create(zone);
  }
}
