// =============================================================================
// VALIDATION SCHEMAS: PRICING & ZONES
// =============================================================================
// Infrastructure Layer - Validación de datos con Zod

import { z } from 'zod';

// ============= ZONE SCHEMAS =============
export const CreateZoneSchema = z.object({
  numero: z.number().int().min(1).max(4).describe('Número de zona (1-4)'),
  nombre: z.string().min(3).max(100).describe('Nombre de la zona'),
  descripcion: z.string().max(500).optional().describe('Descripción opcional'),
});

export const UpdateZoneSchema = z.object({
  numero: z.number().int().min(1).max(4).optional(),
  nombre: z.string().min(3).max(100).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type CreateZoneInput = z.infer<typeof CreateZoneSchema>;
export type UpdateZoneInput = z.infer<typeof UpdateZoneSchema>;

// ============= LOCALITY SCHEMAS =============
export const CreateLocalitySchema = z.object({
  zoneId: z.string().uuid('ID de zona inválido'),
  nombre: z.string().min(3).max(100).describe('Nombre de la localidad'),
  lat: z.number().min(-90).max(90).describe('Latitud GPS'),
  lng: z.number().min(-180).max(180).describe('Longitud GPS'),
});

export const UpdateLocalitySchema = z.object({
  nombre: z.string().min(3).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type CreateLocalityInput = z.infer<typeof CreateLocalitySchema>;
export type UpdateLocalityInput = z.infer<typeof UpdateLocalitySchema>;

// ============= TARIFF_RATE SCHEMAS =============
export const CreateTariffRateSchema = z.object({
  cargoType: z.string().min(1).max(100).describe('Tipo de carga'),
  zone: z.number().int().min(1).max(4).describe('Número de zona'),
  baseTariff: z.number().positive().describe('Tarifa base en pesos'),
  validFrom: z.coerce.date().describe('Fecha de inicio de vigencia'),
  validTo: z.coerce.date().describe('Fecha de fin de vigencia'),
});

export const UpdateTariffRateSchema = z.object({
  cargoType: z.string().min(1).max(100).optional(),
  zone: z.number().int().min(1).max(4).optional(),
  baseTariff: z.number().positive().optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

// Validación cruzada: validFrom < validTo
export const TariffRateWithDateRangeSchema = CreateTariffRateSchema.refine(
  (data) => data.validFrom < data.validTo,
  {
    message: 'validFrom debe ser menor que validTo',
    path: ['validFrom'],
  }
);

export type CreateTariffRateInput = z.infer<typeof TariffRateWithDateRangeSchema>;
export type UpdateTariffRateInput = z.infer<typeof UpdateTariffRateSchema>;

// ============= CALCULATOR_FACTOR SCHEMAS =============
export const CreateCalculatorFactorSchema = z.object({
  nombre: z
    .string()
    .min(1)
    .max(100)
    .describe('Nombre único del factor (ej: IVA, SEGURO_CARGA)'),
  valor: z.number().positive().describe('Valor del factor (ej: 1.21 para IVA 21%)'),
  tipo: z.enum(['percentage', 'multiplier', 'fixed']).describe('Tipo de factor'),
  descripcion: z.string().max(500).optional().describe('Descripción del factor'),
});

export const UpdateCalculatorFactorSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  valor: z.number().positive().optional(),
  tipo: z.enum(['percentage', 'multiplier', 'fixed']).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type CreateCalculatorFactorInput = z.infer<typeof CreateCalculatorFactorSchema>;
export type UpdateCalculatorFactorInput = z.infer<typeof UpdateCalculatorFactorSchema>;

// ============= FORMULA_CALCULO SCHEMAS =============
const FormulaParametroSchema = z.object({
  nombre: z.string().min(1).max(50).describe('Nombre del parámetro'),
  tipo: z.enum(['number', 'boolean', 'string']).describe('Tipo de dato'),
  descripcion: z.string().max(200).optional().describe('Descripción del parámetro'),
  valorDefault: z.union([z.number(), z.boolean(), z.string()]).optional().describe('Valor por defecto'),
  esFactorVinculado: z.boolean().optional().describe('Si se vincula a un CalculatorFactor'),
  factorNombre: z.string().optional().describe('Nombre del CalculatorFactor vinculado'),
});

export const CreateFormulaCalculoSchema = z.object({
  nombre: z.string().min(3).max(100).describe('Nombre descriptivo de la fórmula'),
  codigo: z.string().min(3).max(50).describe('Código técnico único (ej: HAVERSINE_DISTANCIA)'),
  descripcion: z.string().min(10).max(500).describe('Descripción del propósito de la fórmula'),
  formula: z.string().min(5).max(500).describe('La fórmula en sí (ej: R * c * 1.3)'),
  parametros: z.array(FormulaParametroSchema).optional().describe('Parámetros que acepta la fórmula'),
  ordenEjecucion: z.number().int().positive().describe('Orden de ejecución (1, 2, 3...)'),
});

export const UpdateFormulaCalculoSchema = z.object({
  nombre: z.string().min(3).max(100).optional(),
  codigo: z.string().min(3).max(50).optional(),
  descripcion: z.string().min(10).max(500).optional(),
  formula: z.string().min(5).max(500).optional(),
  parametros: z.array(FormulaParametroSchema).optional(),
  ordenEjecucion: z.number().int().positive().optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export type CreateFormulaCalculoInput = z.infer<typeof CreateFormulaCalculoSchema>;
export type UpdateFormulaCalculoInput = z.infer<typeof UpdateFormulaCalculoSchema>;

// ============= QUERY SCHEMAS (Filtros) =============
export const TariffRateFiltersSchema = z.object({
  cargoType: z.string().optional(),
  zone: z.coerce.number().int().min(1).max(4).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export type TariffRateFilters = z.infer<typeof TariffRateFiltersSchema>;
