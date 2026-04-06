// =============================================================================
// REPOSITORY INTERFACE: DEPOSITO
// =============================================================================
// Domain Layer - Contrato que debe implementar la infraestructura
// Define las operaciones que se pueden realizar sobre la entidad

import { Deposito, CreateDepositoInput, UpdateDepositoInput } from '../entities/deposito.entity';

export interface IDepositoRepository {
  // Consultas
  findAll(includeInactive?: boolean): Promise<Deposito[]>;
  findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Deposito[]; total: number }>;
  findById(id: string): Promise<Deposito | null>;
  
  // Mutaciones
  create(data: CreateDepositoInput): Promise<Deposito>;
  update(id: string, data: UpdateDepositoInput): Promise<Deposito>;
  delete(id: string): Promise<void>;
  
  // Validaciones de negocio
  existsByNombre(nombre: string): Promise<boolean>;
}