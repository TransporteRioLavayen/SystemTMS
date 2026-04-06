// =============================================================================
// REPOSITORY: TERCERO (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Tercero, CreateTerceroInput, UpdateTerceroInput } from '../../domain/entities/tercero.entity';
import { ITerceroRepository } from '../../domain/repositories/tercero.repository.interface';

export class SupabaseTerceroRepository implements ITerceroRepository {
  
  async findAll(includeInactive: boolean = false): Promise<Tercero[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000, includeInactive });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; includeInactive?: boolean }): Promise<{ data: Tercero[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('terceros').select('*', { count: 'exact' });
    
    if (!options.includeInactive) {
      query = query.eq('estado', 'activo');
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching terceros: ${error.message}`);
    }
    
    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Tercero | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('terceros')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching tercero: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async findByNombre(nombre: string): Promise<Tercero | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('terceros')
      .select('*')
      .eq('razon_social', nombre)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching tercero by razon social: ${error.message}`);
    }
    
    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateTerceroInput): Promise<Tercero> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('terceros')
      .insert({
        razon_social: data.razonSocial,
        tipo_documento: data.tipoDocumento,
        numero_documento: data.numeroDocumento,
        telefono: data.telefono || null,
        email: data.email || null,
        patente_tractor: data.patenteTractor,
        patente_acoplado: data.patenteAcoplado || null,
        tipo_unidad: data.tipoUnidad,
        vencimiento_seguro: data.vencimientoSeguro || null,
        vencimiento_vtv: data.vencimientoVtv || null,
        nombre_chofer: data.nombreChofer || null,
        dni_chofer: data.dniChofer || null,
        vencimiento_licencia: data.vencimientoLicencia || null,
        vencimiento_linti: data.vencimientoLinti || null,
        tipo_servicio: data.tipoServicio || 'corta_distancia',
        estado: 'activo',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating tercero: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateTerceroInput): Promise<Tercero> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};
    
    if (data.razonSocial) updateData.razon_social = data.razonSocial;
    if (data.tipoDocumento) updateData.tipo_documento = data.tipoDocumento;
    if (data.numeroDocumento) updateData.numero_documento = data.numeroDocumento;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.patenteTractor) updateData.patente_tractor = data.patenteTractor;
    if (data.patenteAcoplado !== undefined) updateData.patente_acoplado = data.patenteAcoplado;
    if (data.tipoUnidad) updateData.tipo_unidad = data.tipoUnidad;
    if (data.vencimientoSeguro !== undefined) updateData.vencimiento_seguro = data.vencimientoSeguro;
    if (data.vencimientoVtv !== undefined) updateData.vencimiento_vtv = data.vencimientoVtv;
    if (data.nombreChofer !== undefined) updateData.nombre_chofer = data.nombreChofer;
    if (data.dniChofer !== undefined) updateData.dni_chofer = data.dniChofer;
    if (data.vencimientoLicencia !== undefined) updateData.vencimiento_licencia = data.vencimientoLicencia;
    if (data.vencimientoLinti !== undefined) updateData.vencimiento_linti = data.vencimientoLinti;
    if (data.tipoServicio) updateData.tipo_servicio = data.tipoServicio;
    if (data.estado) updateData.estado = data.estado;
    
    const { data: result, error } = await supabase
      .from('terceros')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating tercero: ${error.message}`);
    }
    
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    // Soft delete
    const { error } = await supabase
      .from('terceros')
      .update({ estado: 'inactivo' })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting tercero: ${error.message}`);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('terceros')
      .select('*', { count: 'exact', head: true })
      .eq('razon_social', nombre);
    
    if (error) {
      throw new Error(`Error checking tercero existence: ${error.message}`);
    }
    
    return (count || 0) > 0;
  }

  private mapToEntity(data: any): Tercero {
    return {
      id: data.id,
      razonSocial: data.razon_social,
      tipoDocumento: data.tipo_documento as 'CUIT' | 'DNI' | 'CUIL',
      numeroDocumento: data.numero_documento,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      patenteTractor: data.patente_tractor,
      patenteAcoplado: data.patente_acoplado || undefined,
      tipoUnidad: data.tipo_unidad as 'Semi' | 'Chasis' | 'Acoplado' | 'Utilitario',
      vencimientoSeguro: data.vencimiento_seguro || undefined,
      vencimientoVtv: data.vencimiento_vtv || undefined,
      nombreChofer: data.nombre_chofer || undefined,
      dniChofer: data.dni_chofer || undefined,
      vencimientoLicencia: data.vencimiento_licencia || undefined,
      vencimientoLinti: data.vencimiento_linti || undefined,
      tipoServicio: data.tipo_servicio as 'larga_distancia' | 'corta_distancia',
      estado: data.estado as 'activo' | 'inactivo',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const terceroRepository = new SupabaseTerceroRepository();