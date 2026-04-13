// =============================================================================
// CONTROLLER: Calculator Controller
// =============================================================================
// Presentation Layer
// Expone el endpoint público /api/calculator/estimate

import { Request, Response } from 'express';
import { CalculatePricingUseCase, CalculatePricingInput } from '../../application/use-cases/calculator/calculate-pricing.use-case';
import { ITariffRateRepository } from '../../domain/repositories/tariff-rate.repository.interface';
import { ICalculatorFactorRepository } from '../../domain/repositories/calculator-factor.repository.interface';
import { ILocalityRepository } from '../../domain/repositories/locality.repository.interface';
import { logger } from '../logger';

export class CalculatorController {
  private useCase: CalculatePricingUseCase;

  constructor(
    tariffRepository: ITariffRateRepository,
    factorRepository: ICalculatorFactorRepository,
    localityRepository: ILocalityRepository
  ) {
    this.useCase = new CalculatePricingUseCase(tariffRepository, factorRepository, localityRepository);
  }

  // POST /api/calculator/estimate
  // Calcula el precio de un envío basado en parámetros
  async estimate(req: Request, res: Response): Promise<void> {
    try {
      const input: CalculatePricingInput = req.body;

      // Validar campos requeridos
      if (
        typeof input.originLat !== 'number' ||
        typeof input.originLng !== 'number' ||
        typeof input.destLat !== 'number' ||
        typeof input.destLng !== 'number' ||
        !input.cargoType ||
        typeof input.quantity !== 'number'
      ) {
        res.status(400).json({
          error: 'Missing or invalid required fields: originLat, originLng, destLat, destLng, cargoType, quantity',
        });
        return;
      }

      const result = await this.useCase.execute(input);

      logger.info(
        {
          distance: result.distance,
          cargoType: input.cargoType,
          finalCost: result.finalCost,
        },
        'Price estimate calculated'
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error({ error }, 'Error calculating price estimate');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}
