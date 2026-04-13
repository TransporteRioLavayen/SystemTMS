import { Request, Response } from 'express';
import { CreateTariffRateUseCase } from '../../application/use-cases/tariff/create-tariff-rate.use-case';
import { UpdateTariffRateUseCase } from '../../application/use-cases/tariff/update-tariff-rate.use-case';
import { GetEffectiveTariffUseCase } from '../../application/use-cases/tariff/get-effective-tariff.use-case';
import { GetTariffVersionsUseCase } from '../../application/use-cases/tariff/get-tariff-versions.use-case';
import { tariffRateRepository } from '../../infrastructure/repositories/tariff-rate.repository';
import { logger } from '../../infrastructure/logging/logger';

const createUseCase = new CreateTariffRateUseCase(tariffRateRepository);
const updateUseCase = new UpdateTariffRateUseCase(tariffRateRepository);
const getEffectiveUseCase = new GetEffectiveTariffUseCase(tariffRateRepository);
const getVersionsUseCase = new GetTariffVersionsUseCase(tariffRateRepository);

class TariffRateController {
  // GET /api/admin/tariff-rates
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { cargoType, zone, estado } = req.query;
      
      const filters: any = {};
      if (cargoType) filters.cargoType = cargoType as string;
      if (zone) filters.zone = parseInt(zone as string);
      if (estado) filters.estado = estado as string;
      
      const tarifas = await tariffRateRepository.findAll(filters);
      logger.info({ count: tarifas.length }, 'Tariff rates retrieved');
      res.status(200).json({ tariffs: tarifas });
    } catch (error) {
      logger.error({ error }, 'Error getting tariff rates');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/tariff-rates/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tariff = await tariffRateRepository.findById(id);
      
      if (!tariff) {
        res.status(404).json({ error: 'Tariff rate not found' });
        return;
      }

      logger.info({ tariffId: id }, 'Tariff rate retrieved');
      res.status(200).json(tariff);
    } catch (error) {
      logger.error({ error }, 'Error getting tariff rate');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/tariff-rates
  async create(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body;
      const tariff = await createUseCase.execute(input);
      logger.info({ tariffId: tariff.id }, 'Tariff rate created');
      res.status(201).json(tariff);
    } catch (error) {
      logger.error({ error }, 'Error creating tariff rate');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/tariff-rates/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body;
      const tariff = await updateUseCase.execute(id, input);
      logger.info({ tariffId: tariff.id, version: tariff.version }, 'Tariff rate updated (new version)');
      res.status(200).json(tariff);
    } catch (error) {
      logger.error({ error }, 'Error updating tariff rate');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/tariff-rates/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const existing = await tariffRateRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Tariff rate not found' });
        return;
      }

      await tariffRateRepository.deactivate(id);
      logger.info({ tariffId: id }, 'Tariff rate deactivated');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Error deleting tariff rate');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/calculator/estimate
  // Endpoint público para obtener tarifa vigente (para la calculadora)
  async getEffective(req: Request, res: Response): Promise<void> {
    try {
      const { cargoType, zone, date } = req.query;

      if (!cargoType || !zone) {
        res.status(400).json({ error: 'cargoType and zone are required' });
        return;
      }

      const targetDate = date ? new Date(date as string) : undefined;
      const tariff = await getEffectiveUseCase.execute(
        cargoType as string,
        parseInt(zone as string),
        targetDate
      );

      if (!tariff) {
        res.status(404).json({ error: 'No effective tariff found for the given parameters' });
        return;
      }

      res.status(200).json(tariff);
    } catch (error) {
      logger.error({ error }, 'Error getting effective tariff');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/tariff-rates/versions/:cargoType/:zone
  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      const { cargoType, zone } = req.params;

      const versions = await getVersionsUseCase.execute(cargoType, parseInt(zone));

      logger.info(
        { cargoType, zone, versionCount: versions.length },
        'Tariff versions retrieved'
      );
      res.status(200).json(versions);
    } catch (error) {
      logger.error({ error }, 'Error getting tariff versions');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const tariffRateController = new TariffRateController();
