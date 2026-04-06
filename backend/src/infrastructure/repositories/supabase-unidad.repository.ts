// =============================================================================
// REPOSITORY: UNIDAD (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Unidad, CreateUnidadInput, UpdateUnidadInput } from '../../domain/entities/unidad.entity';
import { IUnidadRepository } from '../../domain/repositories/unidad.repository.interface';

export class SupabaseUnidadRepository implements IUnidadRepository {
  
  async findAll(includeInactive: boolean = false): Promise<Unidad[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000, includeInactive });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Unidad[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('unidades').select('*', { count: 'exact' });
    
    if (!options.includeInactive) {
      query = query.neq('estado', 'INACTIVO');
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching unidades: ${error.message}`);
    }
    
    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Unidad | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching unidad: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async findByPatente(patente: string): Promise<Unidad | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('patente', patente)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching unidad by patente: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateUnidadInput): Promise<Unidad> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('unidades')
      .insert({
        patente: data.patente,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        tipo: data.tipo,
        vtv: data.vtv || null,
        seguro: data.seguro || null,
        tipo_servicio: data.tipoServicio || 'corta_distancia',
        estado: 'DISPONIBLE',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating unidad: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateUnidadInput): Promise<Unidad> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};
    
    if (data.patente) updateData.patente = data.patente;
    if (data.marca) updateData.marca = data.marca;
    if (data.modelo) updateData.modelo = data.modelo;
    if (data.anio) updateData.anio = data.anio;
    if (data.tipo) updateData.tipo = data.tipo;
    if (data.vtv !== undefined) updateData.vtv = data.vtv;
    if (data.seguro !== undefined) updateData.seguro = data.seguro;
    if (data.tipoServicio) updateData.tipo_servicio = data.tipoServicio;
    if (data.estado) updateData.estado = data.estado;
    
    const { data: result, error } = await supabase
      .from('unidades')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating unidad: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('unidades')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting unidad: ${error.message}`);
    }
  }

  async existsByPatente(patente: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('unidades')
      .select('*', { count: 'exact', head: true })
      .eq('patente', patente);
    
    if (error) {
      throw new Error(`Error checking unidad existence: ${error.message}`);
    }
    
    return (count || 0) > 0;
  }

  private mapToEntity(data: any): Unidad {
    return {
      id: data.id,
      patente: data.patente,
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio,
      tipo: data.tipo,
      vtv: data.vtv || undefined,
      seguro: data.seguro || undefined,
      tipoServicio: data.tipo_servicio as 'larga_distancia' | 'corta_distancia',
      estado: data.estado as 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const unidadRepository = new SupabaseUnidadRepository();