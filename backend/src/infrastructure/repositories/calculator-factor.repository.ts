// =============================================================================
// REPOSITORY: Calculator Factor Repository (Supabase Implementation)
// =============================================================================
// Infrastructure Layer

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CalculatorFactor,
  CreateCalculatorFactorInput,
  UpdateCalculatorFactorInput,
} from '../../domain/entities/calculator-factor.entity';
import { ICalculatorFactorRepository } from '../../domain/repositories/calculator-factor.repository.interface';
import { logger } from '../logging/logger';

export class CalculatorFactorRepository implements ICalculatorFactorRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateCalculatorFactorInput & { id: string }): Promise<CalculatorFactor> {
    const { data, error } = await this.supabase
      .from('factores_calculadora')
      .insert({
        id: input.id,
        nombre: input.nombre,
        valor: input.valor,
        tipo: input.tipo,
        descripcion: input.descripcion,
        estado: 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create calculator factor');
      throw new Error(`Failed to create factor: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async findById(id: string): Promise<CalculatorFactor | null> {
    const { data, error } = await this.supabase
      .from('factores_calculadora')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find calculator factor by id: ${id}`);
      throw new Error(`Failed to find factor: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findByNombre(nombre: string): Promise<CalculatorFactor | null> {
    const { data, error } = await this.supabase
      .from('factores_calculadora')
      .select('*')
      .eq('nombre', nombre)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find factor by nombre: ${nombre}`);
      throw new Error(`Failed to find factor: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<CalculatorFactor[]> {
    let query = this.supabase.from('factores_calculadora').select('*');

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('nombre');

    if (error) {
      logger.error({ error }, 'Failed to list calculator factors');
      throw new Error(`Failed to list factors: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async update(id: string, input: UpdateCalculatorFactorInput): Promise<CalculatorFactor> {
    const { data, error } = await this.supabase
      .from('factores_calculadora')
      .update({
        nombre: input.nombre,
        valor: input.valor,
        tipo: input.tipo,
        descripcion: input.descripcion,
        estado: input.estado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, `Failed to update calculator factor: ${id}`);
      throw new Error(`Failed to update factor: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('factores_calculadora')
      .update({ estado: 'inactivo', actualizado_en: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error({ error }, `Failed to deactivate calculator factor: ${id}`);
      throw new Error(`Failed to deactivate factor: ${error.message}`);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('factores_calculadora')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre);

    if (error) {
      logger.error({ error }, 'Failed to check factor existence');
      throw new Error(`Failed to check factor: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  private mapToEntity(row: any): CalculatorFactor {
    return {
      id: row.id,
      nombre: row.nombre,
      valor: row.valor,
      tipo: row.tipo,
      descripcion: row.descripcion,
      estado: row.estado,
      createdAt: new Date(row.creado_en),
      updatedAt: new Date(row.actualizado_en),
    };
  }
}

// Instancia singleton del repositorio
import { getSupabaseClient } from '../database/supabase/client';
export const calculatorFactorRepository = new CalculatorFactorRepository(getSupabaseClient());
