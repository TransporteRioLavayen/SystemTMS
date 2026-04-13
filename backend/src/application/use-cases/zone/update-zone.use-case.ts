// =============================================================================
// USE CASE: Update Zone
// =============================================================================
// Application Layer

import { Zone, UpdateZoneInput, updateZoneEntity } from '../../../domain/entities/zone.entity';
import { IZoneRepository } from '../../../domain/repositories/zone.repository.interface';

export class UpdateZoneUseCase {
  constructor(private zoneRepository: IZoneRepository) {}

  async execute(id: string, input: UpdateZoneInput): Promise<Zone> {
    // Obtener la zona actual
    const existingZone = await this.zoneRepository.findById(id);
    if (!existingZone) {
      throw new Error(`Zone with id ${id} not found`);
    }

    // Si se intenta cambiar el número, verificar que no exista
    if (input.numero && input.numero !== existingZone.numero) {
      const other = await this.zoneRepository.findByNumero(input.numero);
      if (other) {
        throw new Error(`Zone with numero ${input.numero} already exists`);
      }
    }

    // Actualizar
    const updatedZone = updateZoneEntity(existingZone, input);
    return this.zoneRepository.update(id, input);
  }
}
