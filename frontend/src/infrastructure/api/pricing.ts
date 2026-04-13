// =============================================================================
// API SERVICE: PRICING (Zones, Localities, Tariffs, Calculator Factors)
// =============================================================================
// Infrastructure Layer - Conecta con el backend

import apiClient from './client';

// ============= TYPES =============
export interface Zone {
  id: string;
  numero: number;
  nombre: string;
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export interface Locality {
  id: string;
  zoneId: string;
  nombre: string;
  lat: number;
  lng: number;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export interface TariffRate {
  id: string;
  cargoType: string;
  zone: number;
  baseTariff: number;
  version: number;
  validFrom: string;
  validTo: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export interface CalculatorFactor {
  id: string;
  nombre: string;
  valor: number;
  tipo: 'percentage' | 'multiplier' | 'fixed';
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

// ============= PRICING CALCULATION (Public API) =============
export interface CalculatePricingInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  cargoType: string;
  quantity: number;
  goodsValue?: number;
  includeInsurance: boolean;
  includeVAT: boolean;
  marginPercentage?: number;
}

export interface PricingResult {
  distance: number;
  baseTariff: number;
  costBeforeTax: number;
  insurance: number;
  tax: number;
  finalCost: number;
  breakdown: {
    baseTariff: number;
    marginMultiplier: number;
    distanceFactor: number;
    quantityMultiplier: number;
    insurancePercentage?: number;
    taxPercentage?: number;
  };
}

// ============= ZONES API =============
export const zonesApi = {
  getAll: async (filters?: { estado?: 'activo' | 'inactivo' }): Promise<Zone[]> => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get(`/admin/zones${params ? '?' + params : ''}`);
    return response.data.zones || response.data;
  },

  getById: async (id: string): Promise<Zone> => {
    const response = await apiClient.get(`/admin/zones/${id}`);
    return response.data;
  },

  create: async (data: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone> => {
    const response = await apiClient.post('/admin/zones', {
      numero: data.numero,
      nombre: data.nombre,
      descripcion: data.descripcion,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Zone> => {
    const response = await apiClient.put(`/admin/zones/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/zones/${id}`);
  },
};

// ============= LOCALITIES API =============
export const localitiesApi = {
  getAll: async (filters?: { estado?: 'activo' | 'inactivo' }): Promise<Locality[]> => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get(`/admin/localities${params ? '?' + params : ''}`);
    return response.data.localities || response.data;
  },

  getByZoneId: async (zoneId: string): Promise<Locality[]> => {
    const response = await apiClient.get(`/admin/zones/${zoneId}/localities`);
    return response.data.localities || response.data;
  },

  getById: async (id: string): Promise<Locality> => {
    const response = await apiClient.get(`/admin/localities/${id}`);
    return response.data;
  },

  create: async (data: Omit<Locality, 'id' | 'createdAt' | 'updatedAt'>): Promise<Locality> => {
    const response = await apiClient.post('/admin/localities', {
      zoneId: data.zoneId,
      nombre: data.nombre,
      lat: data.lat,
      lng: data.lng,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Locality, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Locality> => {
    const response = await apiClient.put(`/admin/localities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/localities/${id}`);
  },
};

// ============= TARIFF RATES API =============
export const tariffRatesApi = {
  getAll: async (filters?: { cargoType?: string; zone?: number; estado?: 'activo' | 'inactivo' }): Promise<TariffRate[]> => {
    const params = new URLSearchParams();
    if (filters?.cargoType) params.append('cargoType', filters.cargoType);
    if (filters?.zone) params.append('zone', filters.zone.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get(`/admin/tariff-rates${params ? '?' + params : ''}`);
    return response.data.tariffs || response.data;
  },

  getById: async (id: string): Promise<TariffRate> => {
    const response = await apiClient.get(`/admin/tariff-rates/${id}`);
    return response.data;
  },

  getVersions: async (cargoType: string, zone: number): Promise<TariffRate[]> => {
    const response = await apiClient.get(
      `/admin/tariff-rates/versions/${encodeURIComponent(cargoType)}/${zone}`
    );
    return response.data.tariffs || response.data;
  },

  create: async (data: Omit<TariffRate, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TariffRate> => {
    const response = await apiClient.post('/admin/tariff-rates', {
      cargoType: data.cargoType,
      zone: data.zone,
      baseTariff: data.baseTariff,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<TariffRate, 'id' | 'version' | 'createdAt' | 'updatedAt'>>): Promise<TariffRate> => {
    const response = await apiClient.put(`/admin/tariff-rates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/tariff-rates/${id}`);
  },
};

// ============= CALCULATOR FACTORS API =============
export const calculatorFactorsApi = {
  getAll: async (filters?: { estado?: 'activo' | 'inactivo' }): Promise<CalculatorFactor[]> => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get(`/admin/calculator-factors${params ? '?' + params : ''}`);
    return response.data.factors || response.data;
  },

  getById: async (id: string): Promise<CalculatorFactor> => {
    const response = await apiClient.get(`/admin/calculator-factors/${id}`);
    return response.data;
  },

  create: async (data: Omit<CalculatorFactor, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalculatorFactor> => {
    const response = await apiClient.post('/admin/calculator-factors', {
      nombre: data.nombre,
      valor: data.valor,
      tipo: data.tipo,
      descripcion: data.descripcion,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<CalculatorFactor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CalculatorFactor> => {
    const response = await apiClient.put(`/admin/calculator-factors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/calculator-factors/${id}`);
  },
};

// ============= FORMULA CALCULO API =============
export interface FormulaParametro {
  nombre: string;
  tipo: 'number' | 'boolean' | 'string';
  descripcion?: string;
  valorDefault?: number | boolean | string;
  esFactorVinculado?: boolean;
  factorNombre?: string;
}

export interface FormulaCalculo {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  formula: string;
  parametros: FormulaParametro[];
  ordenEjecucion: number;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export const formulaCalculoApi = {
  getAll: async (filters?: { estado?: 'activo' | 'inactivo' }): Promise<FormulaCalculo[]> => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    const response = await apiClient.get(`/admin/formulas-calculo${params ? '?' + params : ''}`);
    return response.data.formulas || response.data;
  },

  getAllOrdered: async (): Promise<FormulaCalculo[]> => {
    const response = await apiClient.get('/admin/formulas-calculo/ordered');
    return response.data.formulas || response.data;
  },

  getById: async (id: string): Promise<FormulaCalculo> => {
    const response = await apiClient.get(`/admin/formulas-calculo/${id}`);
    return response.data;
  },

  create: async (data: Omit<FormulaCalculo, 'id' | 'createdAt' | 'updatedAt' | 'estado'>): Promise<FormulaCalculo> => {
    const response = await apiClient.post('/admin/formulas-calculo', {
      nombre: data.nombre,
      codigo: data.codigo,
      descripcion: data.descripcion,
      formula: data.formula,
      parametros: data.parametros,
      ordenEjecucion: data.ordenEjecucion,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<FormulaCalculo, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FormulaCalculo> => {
    const response = await apiClient.put(`/admin/formulas-calculo/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/formulas-calculo/${id}`);
  },
};

// ============= PUBLIC PRICING CALCULATOR API (Sin autenticación requerida) =============
export const pricingCalculatorApi = {
  // Calcular precio completo basado en origen, destino y tipo de carga
  calculate: async (input: CalculatePricingInput): Promise<PricingResult> => {
    const response = await apiClient.post('/pricing/calculate', {
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      cargoType: input.cargoType,
      quantity: input.quantity,
      goodsValue: input.goodsValue,
      includeInsurance: input.includeInsurance,
      includeVAT: input.includeVAT,
      marginPercentage: input.marginPercentage || 0,
    });
    return response.data;
  },

  // Obtener tarifa vigente para un tipo de carga y zona específicos
  getTariff: async (cargoType: string, zone: number): Promise<TariffRate> => {
    const response = await apiClient.get('/pricing/tariff', {
      params: {
        cargoType,
        zone,
      },
    });
    return response.data;
  },

  // Obtener factores de cálculo activos (IVA, Seguro, etc.)
  getFactors: async (): Promise<CalculatorFactor[]> => {
    const response = await apiClient.get('/pricing/factors');
    return response.data;
  },
};
