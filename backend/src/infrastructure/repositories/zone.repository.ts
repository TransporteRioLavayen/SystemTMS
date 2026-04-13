// =============================================================================
// REPOSITORY: Zone Repository (Supabase Implementation)
// =============================================================================
// Infrastructure Layer

import { SupabaseClient } from '@supabase/supabase-js';
import { Zone, CreateZoneInput, UpdateZoneInput } from '../../domain/entities/zone.entity';
import { IZoneRepository } from '../../domain/repositories/zone.repository.interface';
import { logger } from '../logging/logger';

export class ZoneRepository implements IZoneRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateZoneInput & { id: string }): Promise<Zone> {
    const { data, error } = await this.supabase
      .from('zonas')
      .insert({
        id: input.id,
        numero: input.numero,
        nombre: input.nombre,
        descripcion: input.descripcion,
        estado: 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create zone');
      throw new Error(`Failed to create zone: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async findById(id: string): Promise<Zone | null> {
    const { data, error } = await this.supabase
      .from('zonas')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find zone by id: ${id}`);
      throw new Error(`Failed to find zone: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findByNumero(numero: number): Promise<Zone | null> {
    const { data, error } = await this.supabase
      .from('zonas')
      .select('*')
      .eq('numero', numero)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find zone by numero: ${numero}`);
      throw new Error(`Failed to find zone: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<Zone[]> {
    let query = this.supabase.from('zonas').select('*');

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('numero');

    if (error) {
      logger.error({ error }, 'Failed to list zones');
      throw new Error(`Failed to list zones: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async update(id: string, input: UpdateZoneInput): Promise<Zone> {
    const { data, error } = await this.supabase
      .from('zonas')
      .update({
        numero: input.numero,
        nombre: input.nombre,
        descripcion: input.descripcion,
        estado: input.estado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, `Failed to update zone: ${id}`);
      throw new Error(`Failed to update zone: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('zonas').delete().eq('id', id);

    if (error) {
      logger.error({ error }, `Failed to delete zone: ${id}`);
      throw new Error(`Failed to delete zone: ${error.message}`);
    }
  }

  async existsByNumero(numero: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('zonas')
      .select('id', { count: 'exact', head: true })
      .eq('numero', numero);

    if (error) {
      logger.error({ error }, 'Failed to check zone existence');
      throw new Error(`Failed to check zone: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  private mapToEntity(row: any): Zone {
    return {
      id: row.id,
      numero: row.numero,
      nombre: row.nombre,
      descripcion: row.descripcion,
      estado: row.estado,
      createdAt: new Date(row.creado_en),
      updatedAt: new Date(row.actualizado_en),
    };
  }
}

// Instancia singleton del repositorio
import { getSupabaseClient } from '../database/supabase/client';
export const zoneRepository = new ZoneRepository(getSupabaseClient());
