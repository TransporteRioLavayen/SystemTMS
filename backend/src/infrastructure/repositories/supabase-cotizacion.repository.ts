// =============================================================================
// REPOSITORY: COTIZACION (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Cotizacion, CreateCotizacionInput } from '../../domain/entities/cotizacion.entity';
import { ICotizacionRepository } from '../../domain/repositories/cotizacion.repository.interface';

export class SupabaseCotizacionRepository implements ICotizacionRepository {

  async findAllPaginated(options: { offset: number; limit: number }): Promise<{ data: Cotizacion[]; total: number }> {
    const supabase = getSupabaseClient();
    
    const { data, error, count } = await supabase
      .from('cotizaciones')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) {
      throw new Error(`Error fetching cotizaciones: ${error.message}`);
    }

    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Cotizacion | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching cotizacion: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateCotizacionInput): Promise<Cotizacion> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('cotizaciones')
      .insert({
        deposito_origen: data.depositoOrigen,
        zona_destino: data.zonaDestino,
        localidad_destino: data.localidadDestino,
        tipo_carga: data.tipoCarga,
        cantidad: data.cantidad,
        valor_declarado: data.valorDeclarado,
        incluir_iva: data.incluirIva,
        entrega_domicilio: data.entregaDomicilio,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating cotizacion: ${error.message}`);
    }

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('cotizaciones')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting cotizacion: ${error.message}`);
    }
  }

  private mapToEntity(data: any): Cotizacion {
    return {
      id: data.id,
      depositoOrigen: data.deposito_origen,
      zonaDestino: data.zona_destino,
      localidadDestino: data.localidad_destino,
      tipoCarga: data.tipo_carga,
      cantidad: data.cantidad,
      valorDeclarado: parseFloat(data.valor_declarado) || 0,
      incluirIva: data.incluir_iva,
      entregaDomicilio: data.entrega_domicilio,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const cotizacionRepository = new SupabaseCotizacionRepository();