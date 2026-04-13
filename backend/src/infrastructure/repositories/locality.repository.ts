// =============================================================================
// REPOSITORY: Locality Repository (Supabase Implementation)
// =============================================================================
// Infrastructure Layer

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Locality,
  CreateLocalityInput,
  UpdateLocalityInput,
} from '../../domain/entities/locality.entity';
import { ILocalityRepository } from '../../domain/repositories/locality.repository.interface';
import { logger } from '../logging/logger';

export class LocalityRepository implements ILocalityRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateLocalityInput & { id: string }): Promise<Locality> {
    const { data, error } = await this.supabase
      .from('localidades')
      .insert({
        id: input.id,
        zona_id: input.zoneId,
        nombre: input.nombre,
        lat: input.lat,
        lng: input.lng,
        estado: 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create locality');
      throw new Error(`Failed to create locality: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async findById(id: string): Promise<Locality | null> {
    const { data, error } = await this.supabase
      .from('localidades')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find locality by id: ${id}`);
      throw new Error(`Failed to find locality: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findByZoneId(zoneId: string): Promise<Locality[]> {
    const { data, error } = await this.supabase
      .from('localidades')
      .select('*')
      .eq('zona_id', zoneId)
      .eq('estado', 'activo')
      .order('nombre');

    if (error) {
      logger.error({ error }, `Failed to find localities by zone: ${zoneId}`);
      throw new Error(`Failed to find localities: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findAll(filters?: { estado?: 'activo' | 'inactivo' }): Promise<Locality[]> {
    let query = this.supabase.from('localidades').select('*');

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('nombre');

    if (error) {
      logger.error({ error }, 'Failed to list localities');
      throw new Error(`Failed to list localities: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  // Búsqueda por proximidad usando PostGIS (si Supabase lo soporta)
  // De lo contrario, implementar en memoria
  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Locality[]> {
    // Supabase soporta PostGIS con la extensión geo
    // Usamos una búsqueda simple: latitud y longitud dentro de cierto rango
    const latDelta = radiusKm / 111; // 1 grado ~111km
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const { data, error } = await this.supabase
      .from('localidades')
      .select('*')
      .eq('estado', 'activo')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta);

    if (error) {
      logger.warn({ error }, 'Failed to find nearby localities, returning empty');
      return [];
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  async update(id: string, input: UpdateLocalityInput): Promise<Locality> {
    const { data, error } = await this.supabase
      .from('localidades')
      .update({
        nombre: input.nombre,
        lat: input.lat,
        lng: input.lng,
        estado: input.estado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, `Failed to update locality: ${id}`);
      throw new Error(`Failed to update locality: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('localidades').delete().eq('id', id);

    if (error) {
      logger.error({ error }, `Failed to delete locality: ${id}`);
      throw new Error(`Failed to delete locality: ${error.message}`);
    }
  }

  async deactivateByZoneId(zoneId: string): Promise<void> {
    const { error } = await this.supabase
      .from('localidades')
      .update({ estado: 'inactivo', actualizado_en: new Date().toISOString() })
      .eq('zona_id', zoneId);

    if (error) {
      logger.error({ error }, `Failed to deactivate localities in zone: ${zoneId}`);
      throw new Error(`Failed to deactivate localities: ${error.message}`);
    }
  }

  private mapToEntity(row: any): Locality {
    return {
      id: row.id,
      zoneId: row.zona_id,
      nombre: row.nombre,
      lat: row.lat,
      lng: row.lng,
      estado: row.estado,
      createdAt: new Date(row.creado_en),
      updatedAt: new Date(row.actualizado_en),
    };
  }
}

// Instancia singleton del repositorio
import { getSupabaseClient } from '../database/supabase/client';
export const localityRepository = new LocalityRepository(getSupabaseClient());
