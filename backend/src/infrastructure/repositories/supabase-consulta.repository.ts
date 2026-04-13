// =============================================================================
// REPOSITORY: CONSULTA (IMPLEMENTATION)
// =============================================================================
// Infrastructure Layer - Implementación del repositorio usando Supabase

import { getSupabaseClient } from '../database/supabase/client';
import { Consulta, CreateConsultaInput, UpdateConsultaInput } from '../../domain/entities/consulta.entity';
import { IConsultaRepository } from '../../domain/repositories/consulta.repository.interface';

export class SupabaseConsultaRepository implements IConsultaRepository {

  async findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: Consulta[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('consultas').select('*', { count: 'exact' });

    if (options.estado) {
      query = query.eq('estado', options.estado);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) {
      throw new Error(`Error fetching consultas: ${error.message}`);
    }

    return {
      data: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Consulta | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching consulta: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async create(data: CreateConsultaInput): Promise<Consulta> {
    const supabase = getSupabaseClient();
    const { data: result, error } = await supabase
      .from('consultas')
      .insert({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        tipo_consulta: data.tipoConsulta,
        mensaje: data.mensaje,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating consulta: ${error.message}`);
    }

    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateConsultaInput): Promise<Consulta> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = {};

    if (data.estado) updateData.estado = data.estado;
    if (data.respuesta !== undefined) updateData.respuesta = data.respuesta;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from('consultas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating consulta: ${error.message}`);
    }

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('consultas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting consulta: ${error.message}`);
    }
  }

  private mapToEntity(data: any): Consulta {
    return {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      tipoConsulta: data.tipo_consulta,
      mensaje: data.mensaje,
      estado: data.estado,
      respuesta: data.respuesta,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Exportar instancia singleton
export const consultaRepository = new SupabaseConsultaRepository();
