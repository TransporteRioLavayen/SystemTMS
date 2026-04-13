// =============================================================================
// ROUTES: Pricing Calculator (Public Routes)
// =============================================================================
// Presentation Layer
// Rutas públicas para cálculo de precios (sin autenticación requerida)

import { Router, Request, Response } from 'express';
import { tariffRateRepository } from '../../infrastructure/repositories/tariff-rate.repository';
import { calculatorFactorRepository } from '../../infrastructure/repositories/calculator-factor.repository';
import { localityRepository } from '../../infrastructure/repositories/locality.repository';
import { CalculatePricingUseCase } from '../../application/use-cases/calculator/calculate-pricing.use-case';
import { validateBody } from '../../infrastructure/middleware/validation';
import { CreateTariffRateSchema } from '../../infrastructure/middleware/schemas/pricing.schema';
import { logger } from '../../infrastructure/logging/logger';

const router = Router();

const calculatePricingUseCase = new CalculatePricingUseCase(
  tariffRateRepository,
  calculatorFactorRepository,
  localityRepository
);

// POST /api/pricing/calculate
// Calcular precio de cotización basado en origen, destino, tipo de carga, etc.
// NO requiere autenticación
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originLat,
      originLng,
      destLat,
      destLng,
      cargoType,
      quantity,
      goodsValue,
      includeInsurance,
      includeVAT,
      marginPercentage,
    } = req.body;

    // Validaciones básicas
    if (
      originLat === undefined ||
      originLng === undefined ||
      destLat === undefined ||
      destLng === undefined ||
      !cargoType ||
      quantity === undefined
    ) {
      res.status(400).json({
        error: 'Missing required parameters: originLat, originLng, destLat, destLng, cargoType, quantity',
      });
      return;
    }

    const result = await calculatePricingUseCase.execute({
      originLat: parseFloat(originLat),
      originLng: parseFloat(originLng),
      destLat: parseFloat(destLat),
      destLng: parseFloat(destLng),
      cargoType,
      quantity: parseFloat(quantity),
      goodsValue: goodsValue ? parseFloat(goodsValue) : undefined,
      includeInsurance: includeInsurance === true || includeInsurance === 'true',
      includeVAT: includeVAT === true || includeVAT === 'true',
      marginPercentage: marginPercentage ? parseFloat(marginPercentage) : 0,
    });

    logger.info(
      { cargoType, finalCost: result.finalCost },
      'Pricing calculated successfully'
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, 'Error calculating pricing');
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/pricing/tariff
// Obtener tarifa vigente para un tipo de carga y zona específicos
// NO requiere autenticación
router.get('/tariff', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cargoType, zone } = req.query;

    if (!cargoType || !zone) {
      res.status(400).json({
        error: 'Missing required parameters: cargoType, zone',
      });
      return;
    }

    const tariff = await tariffRateRepository.findEffective(
      cargoType as string,
      parseInt(zone as string)
    );

    if (!tariff) {
      res.status(404).json({
        error: `No active tariff found for cargo type "${cargoType}" in zone ${zone}`,
      });
      return;
    }

    logger.info({ cargoType, zone, tariff: tariff.baseTariff }, 'Tariff retrieved');
    res.status(200).json(tariff);
  } catch (error) {
    logger.error({ error }, 'Error getting tariff');
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/pricing/factors
// Obtener factores activos de cálculo (IVA, Seguro, etc.)
// NO requiere autenticación
router.get('/factors', async (req: Request, res: Response): Promise<void> => {
  try {
    const factors = await calculatorFactorRepository.findAll({ estado: 'activo' });

    logger.info({ count: factors.length }, 'Calculator factors retrieved');
    res.status(200).json({ factors });
  } catch (error) {
    logger.error({ error }, 'Error getting calculator factors');
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/pricing/localities
// Obtener todas las localidades con información de zona para el mapa y servicios
// NO requiere autenticación
router.get('/localities', async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneRepository } = await import('../../infrastructure/repositories/zone.repository');
    
    // Obtener todas las zonas
    const zones = await zoneRepository.findAll({ estado: 'activo' });
    const zonasMap = new Map(zones.map(z => [z.id, z]));
    
    // Obtener todas las localidades
    const localities = await localityRepository.findAll({ estado: 'activo' });
    
    // Enriquecer cada localidad con datos de su zona
    const localitiesWithZone = localities.map(loc => {
      const zona = zonasMap.get(loc.zoneId);
      return {
        ...loc,
        zonaNumero: zona?.numero || 0,
        zonaNombre: zona?.nombre || '',
      };
    });

    logger.info({ count: localities.length }, 'Localities with zone retrieved');
    res.status(200).json({ data: localitiesWithZone });
  } catch (error) {
    logger.error({ error }, 'Error getting localities');
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/pricing/cargo-types
// Obtener tipos de carga disponibles desde las tarifas
// NO requiere autenticación
router.get('/cargo-types', async (req: Request, res: Response): Promise<void> => {
  try {
    const tariffs = await tariffRateRepository.findAll({ estado: 'activo' });
    
    // Extraer tipos de carga únicos
    const cargoTypesSet = new Set(tariffs.map(t => t.cargoType));
    const cargoTypes = Array.from(cargoTypesSet).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ')
    }));

    logger.info({ count: cargoTypes.length }, 'Cargo types retrieved');
    res.status(200).json(cargoTypes);
  } catch (error) {
    logger.error({ error }, 'Error getting cargo types');
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/pricing/zones
// Obtener todas las zonas disponibles
// NO requiere autenticación
router.get('/zones', async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneRepository } = await import('../../infrastructure/repositories/zone.repository');
    const zones = await zoneRepository.findAll({ estado: 'activo' });

    logger.info({ count: zones.length }, 'Zones retrieved');
    res.status(200).json({ zones });
  } catch (error) {
    logger.error({ error }, 'Error getting zones');
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
