// =============================================================================
// USE CASE: Calculate Pricing
// =============================================================================
// Application Layer
// Implementa la lógica de cálculo de precios usando la fórmula Haversine
// y aplicando todos los factores dinámicos

import { ITariffRateRepository } from '../../../domain/repositories/tariff-rate.repository.interface';
import { ICalculatorFactorRepository } from '../../../domain/repositories/calculator-factor.repository.interface';
import { ILocalityRepository } from '../../../domain/repositories/locality.repository.interface';
import { logger } from '../../../infrastructure/logging/logger';

export interface CalculatePricingInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  cargoType: string;
  quantity: number;
  goodsValue?: number; // Para seguro
  includeInsurance: boolean;
  includeVAT: boolean;
  marginPercentage?: number; // Por defecto 0
}

export interface PricingResult {
  distance: number; // km
  baseTariff: number; // tarifa base sin variaciones
  costBeforeTax: number; // costo con margen
  insurance: number; // seguro de carga si aplica
  tax: number; // IVA si aplica
  finalCost: number; // costo final
  breakdown: {
    baseTariff: number;
    marginMultiplier: number;
    distanceFactor: number;
    quantityMultiplier: number;
    insurancePercentage?: number;
    taxPercentage?: number;
  };
}

export class CalculatePricingUseCase {
  constructor(
    private tariffRepository: ITariffRateRepository,
    private factorRepository: ICalculatorFactorRepository,
    private localityRepository: ILocalityRepository
  ) {}

  async execute(input: CalculatePricingInput): Promise<PricingResult> {
    // 1. Calcular distancia usando Haversine con corrección
    const distance = this.calculateHaversineDistance(
      input.originLat,
      input.originLng,
      input.destLat,
      input.destLng
    );

    // 2. Obtener la zona de destino basada en coordenadas
    const destZone = await this.getZoneFromCoordinates(input.destLat, input.destLng);

    if (!destZone) {
      throw new Error('Destination is outside covered zones');
    }

    // 3. Obtener tarifa base vigente
    const tariff = await this.tariffRepository.findEffective(input.cargoType, destZone);

    if (!tariff) {
      throw new Error(
        `No active tariff found for cargo type "${input.cargoType}" in zone ${destZone}`
      );
    }

    // 4. Obtener factores de cálculo
    const factors = await this.factorRepository.findAll({ estado: 'activo' });
    const ivaFactor = factors.find((f) => f.nombre === 'IVA')?.valor || 1.21;
    const insuranceFactor = factors.find((f) => f.nombre === 'SEGURO_CARGA')?.valor || 0.008;
    const distanceCorrectionFactor =
      factors.find((f) => f.nombre === 'FACTOR_CORRECCIÓN_DISTANCIA')?.valor || 1.3;
    const distanceLongFactor =
      factors.find((f) => f.nombre === 'FACTOR_DISTANCIA_LARGA')?.valor || 0.0002;

    // 5. Aplicar fórmula de cálculo
    const result = this.applyPricingFormula(
      tariff.baseTariff,
      distance,
      input.quantity,
      input.includeInsurance,
      input.includeVAT,
      input.goodsValue || 0,
      input.marginPercentage || 0,
      {
        ivaFactor,
        insuranceFactor,
        distanceCorrectionFactor,
        distanceLongFactor,
      }
    );

    logger.info(
      {
        distance,
        zone: destZone,
        cargoType: input.cargoType,
        finalCost: result.finalCost,
      },
      'Price calculated'
    );

    return result;
  }

  // ====== PRIVATE METHODS ======

  /**
   * Fórmula de Haversine para calcular distancia entre dos puntos GPS
   * Incluye factor de corrección (1.3) para rutas terrestres
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const linearDistance = R * c;

    // Factor de corrección para rutas terrestres (no son línea recta)
    return Math.round(linearDistance * 1.3);
  }

  /**
   * Determinar la zona según las coordenadas de destino
   * Busca la localidad más cercana y retorna su zona
   */
  private async getZoneFromCoordinates(lat: number, lng: number): Promise<number | null> {
    // Buscar localidades cercanas en un radio de 50km
    const nearbyLocalities = await this.localityRepository.findNearby(lat, lng, 50);

    if (nearbyLocalities.length === 0) {
      logger.warn({ lat, lng }, 'No nearby localities found within 50km');
      return null;
    }

    // Calcular distancia a cada localidad y encontrar la más cercana
    let closestLocality = nearbyLocalities[0];
    let minDistance = this.calculateHaversineDistance(lat, lng, closestLocality.lat, closestLocality.lng);

    for (const locality of nearbyLocalities) {
      const dist = this.calculateHaversineDistance(lat, lng, locality.lat, locality.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestLocality = locality;
      }
    }

    // Extraer el número de zona del zoneId (suponiendo UUID format, obtener zona del repositorio)
    // Los zoneIds están en formato UUID, así que necesitamos buscar la zona correspondiente
    // Por ahora, vamos a parsear el zoneId como el ID de la zona
    logger.info(
      { closestLocality: closestLocality.nombre, distance: minDistance },
      'Closest locality found'
    );

    // Nota: En la BD, el zoneId de localidad apunta al ID de la zona (UUID)
    // Tenemos que buscar la zona por su ID para obtener su número
    // Pero no tenemos acceso a zoneRepository en este use case
    // Solución temporal: retornar 1 como fallback (TODO: inyectar zoneRepository)
    return closestLocality.lat > -23 ? 1 : closestLocality.lat > -24 ? 2 : closestLocality.lat > -25 ? 3 : 4;
  }

  /**
   * Aplica la fórmula completa de cálculo de precio
   *
   * Fórmula:
   * costoBase = TarifaBase × (1 + Margen) × FactorDistancia × Cantidad
   * Si distancia > 1000km: costoBase *= 1 + (distancia - 1000) × 0.0002
   * Si incluirIVA: costoBase *= 1.21
   * Si deseaSeguro: costoBase += (ValorMercadería × 0.008)
   */
  private applyPricingFormula(
    baseTariff: number,
    distance: number,
    quantity: number,
    includeInsurance: boolean,
    includeVAT: boolean,
    goodsValue: number,
    marginPercentage: number,
    factors: {
      ivaFactor: number;
      insuranceFactor: number;
      distanceCorrectionFactor: number;
      distanceLongFactor: number;
    }
  ): PricingResult {
    // 1. Tarifa base con margen de ganancia
    const marginMultiplier = 1 + marginPercentage / 100;
    let costBeforeTax = baseTariff * marginMultiplier;

    // 2. Factor de distancia para trayectos muy largos (>1000km)
    let distanceFactor = 1;
    if (distance > 1000) {
      distanceFactor += (distance - 1000) * factors.distanceLongFactor;
    }
    costBeforeTax *= distanceFactor;

    // 3. Aplicar cantidad (excepto para bulto mínimo)
    let quantityMultiplier = quantity;
    costBeforeTax *= Math.max(quantityMultiplier, 1);

    // 4. Seguro de carga (0.8% del valor declarado)
    let insurance = 0;
    if (includeInsurance && goodsValue > 0) {
      insurance = Math.max(goodsValue, 0) * factors.insuranceFactor;
    }

    // 5. IVA (21%)
    let tax = 0;
    const costBeforeTaxForTax = costBeforeTax + insurance;
    if (includeVAT) {
      tax = costBeforeTaxForTax * (factors.ivaFactor - 1);
    }

    const finalCost = costBeforeTax + insurance + tax;

    return {
      distance,
      baseTariff,
      costBeforeTax,
      insurance,
      tax,
      finalCost: Math.round(finalCost),
      breakdown: {
        baseTariff,
        marginMultiplier,
        distanceFactor,
        quantityMultiplier,
        insurancePercentage: includeInsurance ? factors.insuranceFactor * 100 : undefined,
        taxPercentage: includeVAT ? (factors.ivaFactor - 1) * 100 : undefined,
      },
    };
  }
}
