// =============================================================================
// REPOSITORY: Formula Calculo Repository (Supabase Implementation)
// =============================================================================
// Infrastructure Layer

import { SupabaseClient } from '@supabase/supabase-js';
import {
  FormulaCalculo,
  CreateFormulaCalculoInput,
  UpdateFormulaCalculoInput,
} from '../../domain/entities/formula-calculo.entity';
import { IFormulaCalculoRepository } from '../../domain/repositories/formula-calculo.repository.interface';
import { logger } from '../logging/logger';

export class FormulaCalculoRepository implements IFormulaCalculoRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateFormulaCalculoInput & { id: string }): Promise<FormulaCalculo> {
    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .insert({
        id: input.id,
        nombre: input.nombre,
        codigo: input.codigo,
        descripcion: input.descripcion,
        formula: input.formula,
        parametros: JSON.stringify(input.parametros || []),
        orden_ejecucion: input.ordenEjecucion,
        estado: 'activo',
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create formula calculation');
      throw new Error(`Failed to create formula: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async findById(id: string): Promise<FormulaCalculo | null> {
    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find formula calculation by id: ${id}`);
      throw new Error(`Failed to find formula: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findByCodigo(codigo: string): Promise<FormulaCalculo | null> {
    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find formula calculation by codigo: ${codigo}`);
      throw new Error(`Failed to find formula: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<FormulaCalculo[]> {
    let query = this.supabase.from('formulas_calculo').select('*');

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('orden_ejecucion');

    if (error) {
      logger.error({ error }, 'Failed to list formula calculations');
      throw new Error(`Failed to list formulas: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findAllOrderByOrden(): Promise<FormulaCalculo[]> {
    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .select('*')
      .order('orden_ejecucion', { ascending: true });

    if (error) {
      logger.error({ error }, 'Failed to list formula calculations ordered');
      throw new Error(`Failed to list formulas: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async update(id: string, input: UpdateFormulaCalculoInput): Promise<FormulaCalculo> {
    const updateData: any = {};

    if (input.nombre !== undefined) updateData.nombre = input.nombre;
    if (input.codigo !== undefined) updateData.codigo = input.codigo;
    if (input.descripcion !== undefined) updateData.descripcion = input.descripcion;
    if (input.formula !== undefined) updateData.formula = input.formula;
    if (input.parametros !== undefined) updateData.parametros = JSON.stringify(input.parametros);
    if (input.ordenEjecucion !== undefined) updateData.orden_ejecucion = input.ordenEjecucion;
    if (input.estado !== undefined) updateData.estado = input.estado;

    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, `Failed to update formula calculation: ${id}`);
      throw new Error(`Failed to update formula: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('formulas_calculo')
      .update({ estado: 'inactivo' })
      .eq('id', id);

    if (error) {
      logger.error({ error }, `Failed to deactivate formula calculation: ${id}`);
      throw new Error(`Failed to deactivate formula: ${error.message}`);
    }
  }

  async existsByCodigo(codigo: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('formulas_calculo')
      .select('id', { count: 'exact', head: true })
      .eq('codigo', codigo);

    if (error) {
      logger.error({ error }, 'Failed to check formula existence');
      throw new Error(`Failed to check formula: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  private mapToEntity(row: any): FormulaCalculo {
    return {
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      descripcion: row.descripcion,
      formula: row.formula,
      parametros: typeof row.parametros === 'string' ? JSON.parse(row.parametros) : (row.parametros || []),
      ordenEjecucion: row.orden_ejecucion,
      estado: row.estado,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Instancia singleton del repositorio
import { getSupabaseClient } from '../database/supabase/client';
export const formulaCalculoRepository = new FormulaCalculoRepository(getSupabaseClient());