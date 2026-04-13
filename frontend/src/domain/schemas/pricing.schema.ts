import { z } from 'zod';

// ============= ZONE SCHEMAS =============
export const zoneSchema = z.object({
  numero: z.number().int().min(1).max(4),  // Obligatorio para crear
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

// Para actualizar - todos los campos opcionales
export const zoneUpdateSchema = zoneSchema.partial();

export type ZoneFormData = z.infer<typeof zoneSchema>;
export type ZoneUpdateFormData = z.infer<typeof zoneUpdateSchema>;

// ============= LOCALITY SCHEMAS =============
export const localitySchema = z.object({
  zoneId: z.string().uuid('Debe seleccionar una zona válida'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

export const localityUpdateSchema = localitySchema.partial().extend({
  zoneId: localitySchema.shape.zoneId.optional(),
});

export type LocalityFormData = z.infer<typeof localitySchema>;
export type LocalityUpdateFormData = z.infer<typeof localityUpdateSchema>;

// ============= TARIFF SCHEMAS (CRÍTICO - CORREGIDO) =============
// El backend espera: cargoType, zone, baseTariff, validFrom, validTo
export const tariffSchema = z.object({
  cargoType: z.string().min(1, 'El tipo de carga es obligatorio'),
  zone: z.number().int().min(1).max(4, 'La zona debe ser entre 1 y 4'),
  baseTariff: z.number().positive('La tarifa debe ser mayor a 0'),
  validFrom: z.string().min(1, 'La fecha de inicio es obligatoria'),
  validTo: z.string().min(1, 'La fecha de fin es obligatoria'),
});

export const tariffUpdateSchema = tariffSchema.partial();

export type TariffFormData = z.infer<typeof tariffSchema>;
export type TariffUpdateFormData = z.infer<typeof tariffUpdateSchema>;

// ============= CALCULATOR FACTOR SCHEMAS =============
export const calculatorFactorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  valor: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  tipo: z.enum(['porcentaje', 'multiplicador', 'fijo'], {
    errorMap: () => ({ message: 'Seleccione un tipo válido' }),
  }),
  descripcion: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

export const calculatorFactorUpdateSchema = calculatorFactorSchema.partial();

export type CalculatorFactorFormData = z.infer<typeof calculatorFactorSchema>;
export type CalculatorFactorUpdateFormData = z.infer<typeof calculatorFactorUpdateSchema>;
