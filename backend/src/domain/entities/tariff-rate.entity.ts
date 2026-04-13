// =============================================================================
// ENTIDAD: TARIFF_RATE (Tarifa Base)
// =============================================================================
// Domain Layer
// Nota: Las tarifas se versionan automáticamente. Cada actualización crea una nueva versión.

export interface TariffRate {
  id: string;
  cargoType: string; // "BULTO DE 1 KILO A 10 KILOS", "METROS CUBICOS", etc.
  zone: number; // 1, 2, 3, 4
  baseTariff: number; // Precio en pesos
  version: number; // Versión para auditoría
  validFrom: Date;
  validTo: Date;
  estado: 'activo' | 'inactivo';
  createdBy?: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTariffRateInput {
  cargoType: string;
  zone: number;
  baseTariff: number;
  validFrom: Date;
  validTo: Date;
  createdBy?: string;
}

export interface UpdateTariffRateInput {
  cargoType?: string;
  zone?: number;
  baseTariff?: number;
  validFrom?: Date;
  validTo?: Date;
  estado?: 'activo' | 'inactivo';
  createdBy?: string;
}

export function createTariffRateEntity(data: CreateTariffRateInput & { id: string }): TariffRate {
  return {
    id: data.id,
    cargoType: data.cargoType,
    zone: data.zone,
    baseTariff: data.baseTariff,
    version: 1,
    validFrom: data.validFrom,
    validTo: data.validTo,
    estado: 'activo',
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createNextVersionTariffRate(
  previousTariff: TariffRate,
  updates: Partial<TariffRate>
): TariffRate {
  // Marcar la anterior como inactiva y crear una nueva versión
  return {
    id: crypto.getRandomValues(new Uint8Array(16)).toString(),
    cargoType: updates.cargoType ?? previousTariff.cargoType,
    zone: updates.zone ?? previousTariff.zone,
    baseTariff: updates.baseTariff ?? previousTariff.baseTariff,
    version: previousTariff.version + 1,
    validFrom: updates.validFrom ?? previousTariff.validFrom,
    validTo: updates.validTo ?? previousTariff.validTo,
    estado: 'activo',
    createdBy: updates.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
