// =============================================================================
// REPOSITORY: CHOFER (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Chofer, CreateChoferInput, UpdateChoferInput } from '../../domain/entities/chofer.entity';
import { IChoferRepository } from '../../domain/repositories/chofer.repository.interface';

export class SupabaseChoferRepository implements IChoferRepository {
  
  async findAll(includeInactive: boolean = false): Promise<Chofer[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000, includeInactive });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Chofer[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('choferes').select('*', { count: 'exact' });
    
    if (!options.includeInactive) {
      query = query.neq('estado', 'INACTIVO');
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching choferes: ${error.message}`);
    }
    
    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Chofer | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('choferes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching chofer: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async findByDni(dni: string): Promise<Chofer | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('choferes')
      .select('*')
      .eq('dni', dni)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching chofer by DNI: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateChoferInput): Promise<Chofer> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('choferes')
      .insert({
        nombre: data.nombre,
        dni: data.dni,
        licencia: data.licencia,
        vencimiento_licencia: data.vencimientoLicencia,
        telefono: data.telefono,
        estado: 'DISPONIBLE',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating chofer: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateChoferInput): Promise<Chofer> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};
    
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.dni) updateData.dni = data.dni;
    if (data.licencia) updateData.licencia = data.licencia;
    if (data.vencimientoLicencia) updateData.vencimiento_licencia = data.vencimientoLicencia;
    if (data.telefono) updateData.telefono = data.telefono;
    if (data.estado) updateData.estado = data.estado;
    
    const { data: result, error } = await supabase
      .from('choferes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating chofer: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('choferes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting chofer: ${error.message}`);
    }
  }

  async existsByDni(dni: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true })
      .eq('dni', dni);
    
    if (error) {
      throw new Error(`Error checking chofer existence: ${error.message}`);
    }
    
    return (count || 0) > 0;
  }

  private mapToEntity(data: any): Chofer {
    return {
      id: data.id,
      nombre: data.nombre,
      dni: data.dni,
      licencia: data.licencia,
      vencimientoLicencia: data.vencimiento_licencia,
      telefono: data.telefono,
      estado: data.estado as 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const choferRepository = new SupabaseChoferRepository();