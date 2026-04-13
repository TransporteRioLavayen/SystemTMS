// =============================================================================
// CONTROLLER: Locality Controller
// =============================================================================
// Presentation Layer
// Maneja las requests HTTP para gestión de localidades

import { Request, Response } from 'express';
import { localityRepository } from '../../infrastructure/repositories/locality.repository';
import { zoneRepository } from '../../infrastructure/repositories/zone.repository';
import { createLocalityEntity, updateLocalityEntity } from '../../domain/entities/locality.entity';
import { logger } from '../../infrastructure/logging/logger';

class LocalityController {
  // GET /api/admin/localities
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { estado, zoneId } = req.query;
      
      const filters: any = {};
      if (estado) filters.estado = estado;

      let localities;
      if (zoneId && typeof zoneId === 'string') {
        localities = await localityRepository.findByZoneId(zoneId);
        if (estado) {
          localities = localities.filter(l => l.estado === estado);
        }
      } else {
        localities = await localityRepository.findAll(filters);
      }

      logger.info({ count: localities.length }, 'Localities retrieved');
      res.status(200).json({ localities });
    } catch (error) {
      logger.error({ error }, 'Error getting localities');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/localities/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const locality = await localityRepository.findById(id);

      if (!locality) {
        res.status(404).json({ error: 'Locality not found' });
        return;
      }

      logger.info({ localityId: id }, 'Locality retrieved');
      res.status(200).json(locality);
    } catch (error) {
      logger.error({ error }, 'Error getting locality');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/zones/:zoneId/localities
  async getByZoneId(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;

      // Verificar que la zona exista
      const zone = await zoneRepository.findById(zoneId);
      if (!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
      }

      const localities = await localityRepository.findByZoneId(zoneId);
      logger.info({ zoneId, count: localities.length }, 'Localities by zone retrieved');
      res.status(200).json(localities);
    } catch (error) {
      logger.error({ error }, 'Error getting localities by zone');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/localities
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId, nombre, lat, lng } = req.body;

      // Verificar que la zona exista
      const zone = await zoneRepository.findById(zoneId);
      if (!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
      }

      // Crear la localidad
      const locality = createLocalityEntity({
        id: crypto.randomUUID ? crypto.randomUUID() : `locality-${Date.now()}`,
        zoneId,
        nombre,
        lat,
        lng,
      });

      const created = await localityRepository.create(locality);
      logger.info({ localityId: created.id, zoneId }, 'Locality created');
      res.status(201).json(created);
    } catch (error) {
      logger.error({ error }, 'Error creating locality');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/localities/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await localityRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Locality not found' });
        return;
      }

      const updated = updateLocalityEntity(existing, req.body);
      const result = await localityRepository.update(id, req.body);

      logger.info({ localityId: id }, 'Locality updated');
      res.status(200).json(result);
    } catch (error) {
      logger.error({ error }, 'Error updating locality');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/localities/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await localityRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Locality not found' });
        return;
      }

      await localityRepository.delete(id);
      logger.info({ localityId: id }, 'Locality deleted');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Error deleting locality');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const localityController = new LocalityController();
