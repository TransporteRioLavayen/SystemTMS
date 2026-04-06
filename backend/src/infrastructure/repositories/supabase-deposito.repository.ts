// =============================================================================
// REPOSITORY: DEPOSITO (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Deposito, CreateDepositoInput, UpdateDepositoInput } from '../../domain/entities/deposito.entity';
import { IDepositoRepository } from '../../domain/repositories/deposito.repository.interface';

export class SupabaseDepositoRepository implements IDepositoRepository {
  
  async findAll(includeInactive: boolean = false): Promise<Deposito[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000, includeInactive });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Deposito[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('depositos').select('*', { count: 'exact' });
    
    if (!options.includeInactive) {
      query = query.eq('estado', 'activo');
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching depositos: ${error.message}`);
    }
    
    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Deposito | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('depositos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw new Error(`Error fetching deposito: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateDepositoInput): Promise<Deposito> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('depositos')
      .insert({
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        capacidad: data.capacidad,
        encargado: data.encargado || null,
        lat: data.lat || null,
        lng: data.lng || null,
        estado: 'activo',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating deposito: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateDepositoInput): Promise<Deposito> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};
    
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.ubicacion) updateData.ubicacion = data.ubicacion;
    if (data.capacidad) updateData.capacidad = data.capacidad;
    if (data.encargado !== undefined) updateData.encargado = data.encargado;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.estado) updateData.estado = data.estado;
    
    const { data: result, error } = await supabase
      .from('depositos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating deposito: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    // Soft delete: cambiar estado a inactivo
    const { error } = await supabase
      .from('depositos')
      .update({ estado: 'inactivo' })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting deposito: ${error.message}`);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('depositos')
      .select('*', { count: 'exact', head: true })
      .eq('nombre', nombre);
    
    if (error) {
      throw new Error(`Error checking deposito existence: ${error.message}`);
    }
    
    return (count || 0) > 0;
  }

  private mapToEntity(data: any): Deposito {
    return {
      id: data.id,
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      capacidad: data.capacidad,
      encargado: data.encargado || undefined,
      lat: data.lat || undefined,
      lng: data.lng || undefined,
      estado: data.estado as 'activo' | 'inactivo',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const depositoRepository = new SupabaseDepositoRepository();