// =============================================================================
// ENTIDAD: FORMULA_CALCULO (Fórmula de Cálculo de Precios)
// =============================================================================
// Domain Layer
// Representa las fórmulas usadas en el cálculo de cotizaciones

export interface FormulaCalculo {
  id: string;
  nombre: string;           // Nombre descriptivo de la fórmula
  codigo: string;           // Código técnico (ej: "HAVERSINE_DISTANCIA", "PRECIO_FINAL")
  descripcion: string;      // Descripción del propósito de la fórmula
  formula: string;         // La fórmula en sí (ej: "R * c * 1.3")
  parametros: FormulaParametro[]; // Parámetros que acepta
  ordenEjecucion: number;  // Orden en que se ejecuta (1, 2, 3...)
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

export interface FormulaParametro {
  nombre: string;           // Nombre del parámetro (ej: "distancia", "tarifaBase")
  tipo: 'number' | 'boolean' | 'string';
  descripcion?: string;
  valorDefault?: number | boolean | string;
  esFactorVinculado?: boolean; // Si este parámetro se vincula a un CalculatorFactor
  factorNombre?: string;    // Nombre del CalculatorFactor vinculado
}

export interface CreateFormulaCalculoInput {
  nombre: string;
  codigo: string;
  descripcion: string;
  formula: string;
  parametros: FormulaParametro[];
  ordenEjecucion: number;
}

export interface UpdateFormulaCalculoInput {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  formula?: string;
  parametros?: FormulaParametro[];
  ordenEjecucion?: number;
  estado?: 'activo' | 'inactivo';
}

export function createFormulaCalculoEntity(
  data: CreateFormulaCalculoInput & { id: string }
): FormulaCalculo {
  return {
    id: data.id,
    nombre: data.nombre,
    codigo: data.codigo,
    descripcion: data.descripcion,
    formula: data.formula,
    parametros: data.parametros || [],
    ordenEjecucion: data.ordenEjecucion,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateFormulaCalculoEntity(
  formula: FormulaCalculo,
  data: UpdateFormulaCalculoInput
): FormulaCalculo {
  return {
    ...formula,
    nombre: data.nombre ?? formula.nombre,
    codigo: data.codigo ?? formula.codigo,
    descripcion: data.descripcion ?? formula.descripcion,
    formula: data.formula ?? formula.formula,
    parametros: data.parametros ?? formula.parametros,
    ordenEjecucion: data.ordenEjecucion ?? formula.ordenEjecucion,
    estado: data.estado ?? formula.estado,
    updatedAt: new Date(),
  };
}