// =============================================================================
// CONTROLLER: Zone Controller
// =============================================================================
// Presentation Layer
// Maneja las requests HTTP para gestión de zonas

import { Request, Response } from 'express';
import { CreateZoneUseCase } from '../../application/use-cases/zone/create-zone.use-case';
import { UpdateZoneUseCase } from '../../application/use-cases/zone/update-zone.use-case';
import { GetAllZonesUseCase } from '../../application/use-cases/zone/get-all-zones.use-case';
import { GetZoneByIdUseCase } from '../../application/use-cases/zone/get-zone-by-id.use-case';
import { DeleteZoneUseCase } from '../../application/use-cases/zone/delete-zone.use-case';
import { zoneRepository } from '../../infrastructure/repositories/zone.repository';
import { logger } from '../../infrastructure/logging/logger';

// Instancias de use cases
const createUseCase = new CreateZoneUseCase(zoneRepository);
const updateUseCase = new UpdateZoneUseCase(zoneRepository);
const getAllUseCase = new GetAllZonesUseCase(zoneRepository);
const getByIdUseCase = new GetZoneByIdUseCase(zoneRepository);
const deleteUseCase = new DeleteZoneUseCase(zoneRepository);

class ZoneController {
  // GET /api/admin/zones
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.query;
      const zones = await getAllUseCase.execute({
        estado: estado as 'activo' | 'inactivo' | undefined,
      });
      logger.info({ count: zones.length }, 'Zones retrieved');
      res.status(200).json({ zones });
    } catch (error) {
      logger.error({ error }, 'Error getting zones');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/zones/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const zone = await getByIdUseCase.execute(id);

      if (!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
      }

      logger.info({ zoneId: id }, 'Zone retrieved');
      res.status(200).json(zone);
    } catch (error) {
      logger.error({ error }, 'Error getting zone');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/zones
  async create(req: Request, res: Response): Promise<void> {
    try {
      const zone = await createUseCase.execute(req.body);
      logger.info({ zoneId: zone.id, numero: zone.numero }, 'Zone created');
      res.status(201).json(zone);
    } catch (error) {
      logger.error({ error }, 'Error creating zone');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/zones/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const zone = await updateUseCase.execute(id, req.body);
      logger.info({ zoneId: id }, 'Zone updated');
      res.status(200).json(zone);
    } catch (error) {
      logger.error({ error }, 'Error updating zone');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/zones/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await deleteUseCase.execute(id);
      logger.info({ zoneId: id }, 'Zone deleted');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Error deleting zone');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const zoneController = new ZoneController();
