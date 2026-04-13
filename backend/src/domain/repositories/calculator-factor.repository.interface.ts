// =============================================================================
// INTERFAZ: CALCULATOR_FACTOR REPOSITORY
// =============================================================================
// Domain Layer

import {
  CalculatorFactor,
  CreateCalculatorFactorInput,
  UpdateCalculatorFactorInput,
} from '../entities/calculator-factor.entity';

export interface ICalculatorFactorRepository {
  // Crear
  create(input: CreateCalculatorFactorInput): Promise<CalculatorFactor>;

  // Leer
  findById(id: string): Promise<CalculatorFactor | null>;
  findByNombre(nombre: string): Promise<CalculatorFactor | null>;
  findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<CalculatorFactor[]>;

  // Actualizar
  update(id: string, input: UpdateCalculatorFactorInput): Promise<CalculatorFactor>;

  // Eliminar (soft delete)
  deactivate(id: string): Promise<void>;

  // Existencia
  existsByNombre(nombre: string): Promise<boolean>;
}
