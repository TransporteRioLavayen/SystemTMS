// =============================================================================
// ENTIDAD: CALCULATOR_FACTOR (Factor de Cálculo)
// =============================================================================
// Domain Layer
// Factores dinámicos como IVA, Seguro, Factor de distancia, etc.

export type FactorType = 'percentage' | 'multiplier' | 'fixed';

export interface CalculatorFactor {
  id: string;
  nombre: string; // "IVA", "SEGURO_CARGA", "FACTOR_CORRECCIÓN_DISTANCIA", etc.
  valor: number;
  tipo: FactorType;
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalculatorFactorInput {
  nombre: string;
  valor: number;
  tipo: FactorType;
  descripcion?: string;
}

export interface UpdateCalculatorFactorInput {
  nombre?: string;
  valor?: number;
  tipo?: FactorType;
  descripcion?: string;
  estado?: 'activo' | 'inactivo';
}

export function createCalculatorFactorEntity(
  data: CreateCalculatorFactorInput & { id: string }
): CalculatorFactor {
  return {
    id: data.id,
    nombre: data.nombre,
    valor: data.valor,
    tipo: data.tipo,
    descripcion: data.descripcion,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateCalculatorFactorEntity(
  factor: CalculatorFactor,
  data: UpdateCalculatorFactorInput
): CalculatorFactor {
  return {
    ...factor,
    nombre: data.nombre ?? factor.nombre,
    valor: data.valor ?? factor.valor,
    tipo: data.tipo ?? factor.tipo,
    descripcion: data.descripcion ?? factor.descripcion,
    estado: data.estado ?? factor.estado,
    updatedAt: new Date(),
  };
}
