// =============================================================================
// INTERFAZ: FORMULA_CALCULO REPOSITORY
// =============================================================================
// Domain Layer

import {
  FormulaCalculo,
  CreateFormulaCalculoInput,
  UpdateFormulaCalculoInput,
} from '../entities/formula-calculo.entity';

export interface IFormulaCalculoRepository {
  // Crear
  create(input: CreateFormulaCalculoInput): Promise<FormulaCalculo>;

  // Leer
  findById(id: string): Promise<FormulaCalculo | null>;
  findByCodigo(codigo: string): Promise<FormulaCalculo | null>;
  findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<FormulaCalculo[]>;
  findAllOrderByOrden(): Promise<FormulaCalculo[]>;

  // Actualizar
  update(id: string, input: UpdateFormulaCalculoInput): Promise<FormulaCalculo>;

  // Eliminar (soft delete)
  deactivate(id: string): Promise<void>;

  // Existencia
  existsByCodigo(codigo: string): Promise<boolean>;
}