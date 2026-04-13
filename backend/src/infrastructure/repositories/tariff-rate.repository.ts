// =============================================================================
// REPOSITORY: Tariff Rate Repository (Supabase Implementation)
// =============================================================================
// Infrastructure Layer
// Maneja la lógica de persistencia para tarifas con versionado

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TariffRate,
  CreateTariffRateInput,
  UpdateTariffRateInput,
} from '../../domain/entities/tariff-rate.entity';
import { ITariffRateRepository } from '../../domain/repositories/tariff-rate.repository.interface';
import { logger } from '../logging/logger';

export class TariffRateRepository implements ITariffRateRepository {
  constructor(private supabase: SupabaseClient) {}

  // ====== CREATE ======
  async create(input: CreateTariffRateInput & { id: string }): Promise<TariffRate> {
    const { data, error } = await this.supabase
      .from('tarifas')
      .insert({
        id: input.id,
        tipo_carga: input.cargoType,
        numero_zona: input.zone,
        tarifa_base: input.baseTariff,
        version: 1,
        valida_desde: input.validFrom.toISOString(),
        valida_hasta: input.validTo.toISOString(),
        estado: 'activo',
        creado_por: input.createdBy,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to create tariff rate');
      throw new Error(`Failed to create tariff rate: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  // ====== READ ======
  async findById(id: string): Promise<TariffRate | null> {
    const { data, error } = await this.supabase
      .from('tarifas')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find tariff by id: ${id}`);
      throw new Error(`Failed to find tariff: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  async findAll(filters?: {
    cargoType?: string;
    zone?: number;
    estado?: 'activo' | 'inactivo';
  }): Promise<TariffRate[]> {
    let query = this.supabase.from('tarifas').select('*');

    if (filters?.cargoType) {
      query = query.eq('tipo_carga', filters.cargoType);
    }
    if (filters?.zone) {
      query = query.eq('numero_zona', filters.zone);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('tipo_carga').order('numero_zona').order('version');

    if (error) {
      logger.error({ error }, 'Failed to list tariff rates');
      throw new Error(`Failed to list tariffs: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  // Encontrar tarifa vigente en una fecha específica
  async findEffective(cargoType: string, zone: number, date?: Date): Promise<TariffRate | null> {
    const targetDate = date ? date.toISOString() : new Date().toISOString();

    const { data, error } = await this.supabase
      .from('tarifas')
      .select('*')
      .eq('tipo_carga', cargoType)
      .eq('numero_zona', zone)
      .eq('estado', 'activo')
      .lte('valida_desde', targetDate)
      .gt('valida_hasta', targetDate)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error({ error }, `Failed to find effective tariff for ${cargoType}, zone ${zone}`);
      throw new Error(`Failed to find effective tariff: ${error.message}`);
    }

    return data ? this.mapToEntity(data) : null;
  }

  // Encontrar todas las versiones de una tarifa
  async findVersions(cargoType: string, zone: number): Promise<TariffRate[]> {
    const { data, error } = await this.supabase
      .from('tarifas')
      .select('*')
      .eq('tipo_carga', cargoType)
      .eq('numero_zona', zone)
      .order('version', { ascending: false });

    if (error) {
      logger.error({ error }, `Failed to find versions for ${cargoType}, zone ${zone}`);
      throw new Error(`Failed to find versions: ${error.message}`);
    }

    return (data || []).map((d) => this.mapToEntity(d));
  }

  // ====== UPDATE ======
  // Nota: Esta operación crea una nueva versión, no actualiza la existente
  async update(id: string, input: UpdateTariffRateInput & { id: string }): Promise<TariffRate> {
    const { data, error } = await this.supabase
      .from('tarifas')
      .insert({
        id: input.id,
        tipo_carga: input.cargoType,
        numero_zona: input.zone,
        tarifa_base: input.baseTariff,
        version: 0, // Se incrementará en el trigger de Supabase
        valida_desde: input.validFrom?.toISOString(),
        valida_hasta: input.validTo?.toISOString(),
        estado: input.estado || 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to update tariff rate');
      throw new Error(`Failed to update tariff: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  // ====== DELETE (Soft Delete) ======
  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tarifas')
      .update({ estado: 'inactivo', actualizado_en: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error({ error }, `Failed to deactivate tariff: ${id}`);
      throw new Error(`Failed to deactivate tariff: ${error.message}`);
    }

    // Registrar en auditoría
    await this.logToHistory(id, 'DESACTIVAR', null, { estado: 'inactivo' }, 'Version deactivated');
  }

  // ====== UTILITY ======
  async existsByCargoAndZone(cargoType: string, zone: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tarifas')
      .select('id', { count: 'exact', head: true })
      .eq('tipo_carga', cargoType)
      .eq('numero_zona', zone)
      .eq('estado', 'activo');

    if (error) {
      logger.error({ error }, `Failed to check tariff existence`);
      throw new Error(`Failed to check tariff: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  // ====== PRIVATE METHODS ======
  private mapToEntity(row: any): TariffRate {
    return {
      id: row.id,
      cargoType: row.tipo_carga,
      zone: row.numero_zona,
      baseTariff: row.tarifa_base,
      version: row.version,
      validFrom: new Date(row.valida_desde),
      validTo: new Date(row.valida_hasta),
      estado: row.estado,
      createdBy: row.creado_por,
      createdAt: new Date(row.creado_en),
      updatedAt: new Date(row.actualizado_en),
    };
  }

  // Registrar cambio en la tabla de auditoría
  private async logToHistory(
    tariffId: string,
    action: string,
    oldValue: any,
    newValue: any,
    reason?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('historial_tarifas').insert({
      tarifa_id: tariffId,
      accion: action,
      valor_anterior: oldValue,
      valor_nuevo: newValue,
      razon_cambio: reason,
      creado_en: new Date().toISOString(),
    });

    if (error) {
      logger.warn({ error }, 'Failed to log tariff change to history');
      // No hacemos throw aquí - logging fallback
    }
  }
}

// Instancia singleton del repositorio
import { getSupabaseClient } from '../database/supabase/client';
export const tariffRateRepository = new TariffRateRepository(getSupabaseClient());
