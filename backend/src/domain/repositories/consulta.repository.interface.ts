// =============================================================================
// REPOSITORY INTERFACE: CONSULTA
// =============================================================================
// Domain Layer - Interfaz del repositorio para consultas

import { Consulta, CreateConsultaInput, UpdateConsultaInput } from '../entities/consulta.entity';

export interface IConsultaRepository {
  findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: Consulta[]; total: number }>;
  findById(id: string): Promise<Consulta | null>;
  create(data: CreateConsultaInput): Promise<Consulta>;
  update(id: string, data: UpdateConsultaInput): Promise<Consulta>;
  delete(id: string): Promise<void>;
}
