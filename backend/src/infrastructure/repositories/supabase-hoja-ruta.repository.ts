// =============================================================================
// SUPABASE HOJA DE RUTA REPOSITORY - BACKEND
// =============================================================================

import { getSupabaseClient } from '../database/supabase/client';
import { HojaDeRuta, RemitoHoja } from '../../domain/entities/hoja-ruta.entity';
import { IHojaDeRutaRepository } from '../../domain/repositories/hoja-ruta.repository.interface';
import { barcodeService } from '../services/barcode.service';
import { logger } from '../logging/logger';

export class SupabaseHojaDeRutaRepository implements IHojaDeRutaRepository {
  
  async findAll(estado?: string): Promise<HojaDeRuta[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000, estado });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: HojaDeRuta[]; total: number }> {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('hojas_ruta')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (options.estado) {
      query = query.eq('estado', options.estado);
    }
    
    const { data, error, count } = await query
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching hojas de ruta: ${error.message}`);
    }
    
    const hojas = data?.map((row: any) => this.mapToEntity(row)) || [];
    
    // FIX N+1: Una sola query con .in() en vez de loop
    if (hojas.length > 0) {
      const hojaIds = hojas.map(h => h.id);
      const { data: cargasData } = await supabase
        .from('hoja_ruta_remitos')
        .select(`
          id, orden, estado_entrega, fecha_entrega, motivo_rechazo, notas_rechazo, hoja_ruta_id, remito_id,
          remito:remitos(id, destinatario, direccion, whatsapp, bultos, seguimiento)
        `)
        .in('hoja_ruta_id', hojaIds);
      
      // Agrupar cargas por hoja_ruta_id
      const cargasByHoja = new Map<string, RemitoHoja[]>();
      for (const carga of (cargasData || [])) {
        const hid = carga.hoja_ruta_id;
        if (!cargasByHoja.has(hid)) {
          cargasByHoja.set(hid, []);
        }
        cargasByHoja.get(hid)!.push(this.mapCargaToEntity(carga));
      }
      
      // Asignar cargas a cada hoja
      for (const hoja of hojas) {
        hoja.cargas = cargasByHoja.get(hoja.id) || [];
      }
    }
    
    return {
      data: hojas,
      total: count || 0,
    };
  }

  async findByChoferDni(dni: string): Promise<HojaDeRuta[]> {
    const supabase = getSupabaseClient();
    
    // Primero buscar el chofer por DNI
    const { data: choferData } = await supabase
      .from('choferes')
      .select('nombre')
      .eq('dni', dni)
      .single();
    
    if (!choferData) {
      return [];
    }

    const { data, error } = await supabase
      .from('hojas_ruta')
      .select('*')
      .eq('chofer', choferData.nombre)
      .in('estado', ['Lista para salir', 'En reparto', 'Completada'])
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching hojas de ruta by chofer DNI: ${error.message}`);
    }
    
    const hojas = data?.map((row: any) => this.mapToEntity(row)) || [];
    
    // FIX N+1: Una sola query con .in()
    if (hojas.length > 0) {
      const hojaIds = hojas.map(h => h.id);
      const { data: cargasData } = await supabase
        .from('hoja_ruta_remitos')
        .select(`
          id, orden, estado_entrega, fecha_entrega, motivo_rechazo, notas_rechazo, hoja_ruta_id, remito_id,
          remito:remitos(id, destinatario, direccion, whatsapp, bultos, seguimiento)
        `)
        .in('hoja_ruta_id', hojaIds);
      
      const cargasByHoja = new Map<string, RemitoHoja[]>();
      for (const carga of (cargasData || [])) {
        const hid = carga.hoja_ruta_id;
        if (!cargasByHoja.has(hid)) {
          cargasByHoja.set(hid, []);
        }
        cargasByHoja.get(hid)!.push(this.mapCargaToEntity(carga));
      }
      
      for (const hoja of hojas) {
        hoja.cargas = cargasByHoja.get(hoja.id) || [];
      }
    }
    
    return hojas;
  }

  async findById(id: string): Promise<HojaDeRuta | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hojas_ruta')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching hoja de ruta: ${error.message}`);
    }
    
    const hoja = this.mapToEntity(data);
    hoja.cargas = await this.getCargasByHojaId(id);
    
    return hoja;
  }

  async create(hoja: Omit<HojaDeRuta, 'id' | 'createdAt' | 'updatedAt'>): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    // Mapear el estado al formato de la base de datos
    const estadoDB = this.mapEstadoToDB(hoja.estado || 'Lista para salir');
    
    // Preparar cargas para el RPC
    const cargasPayload = (hoja.cargas || []).map((c, index) => ({
      remitoId: c.remitoId || c.id,
      orden: index + 1
    }));

    // Ejecutar RPC para creación atómica (incluye inserción de cargas)
    const { data: hojaId, error: rpcError } = await supabase.rpc('create_hoja_ruta_with_cargas', {
      p_unidad: hoja.unidad,
      p_chofer: hoja.chofer,
      p_acompanante: hoja.acompanante || null,
      p_deposito_origen_id: hoja.depositoOrigenId || null,
      p_tipo_flota: hoja.tipoFlota || 'propia',
      p_tipo_servicio: hoja.tipoServicio || 'corta_distancia',
      p_estado: estadoDB,
      p_cargas: cargasPayload
    });

    if (rpcError) {
      logger.error('[Repository] RPC Error: %o', rpcError);
      throw new Error(`Error creating hoja de ruta: ${rpcError.message}`);
    }

    // Registrar evento de tracking: Preparado (hoja de ruta creada)
    await this.registrarTrackingEvent(hojaId, 'Preparado', 'hoja_preparada', 'La hoja de ruta fue preparada y está lista para salir', 'Centro de distribución');
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error('Hoja de ruta no encontrada después de crear');
    return result;
  }

  async update(id: string, hoja: Partial<HojaDeRuta>): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    const updateData: any = {};
    
    if (hoja.unidad !== undefined) updateData.unidad = hoja.unidad;
    if (hoja.chofer !== undefined) updateData.chofer = hoja.chofer;
    if (hoja.acompanante !== undefined) updateData.acompanante = hoja.acompanante;
    if (hoja.depositoOrigenId !== undefined) updateData.deposito_origen_id = hoja.depositoOrigenId;
    if (hoja.tipoFlota !== undefined) updateData.tipo_flota = hoja.tipoFlota;
    if (hoja.tipoServicio !== undefined) updateData.tipo_servicio = hoja.tipoServicio;
    if (hoja.estado !== undefined) {
      const estadoDB = this.mapEstadoToDB(hoja.estado);
      logger.debug('[update] Estado a guardar: %o', { estadoInput: hoja.estado, estadoDB });
      updateData.estado = estadoDB;
    }
    if (hoja.kmSalida !== undefined) updateData.km_salida = hoja.kmSalida;
    if (hoja.kmLlegada !== undefined) updateData.km_llegada = hoja.kmLlegada;

    logger.debug('[update] Datos a actualizar: %o', updateData);
    
    const { data, error } = await supabase
      .from('hojas_ruta')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('[update] Error: %o', error);
      throw new Error(`Error updating hoja de ruta: ${error.message}`);
    }
    
    const result = await this.findById(id);
    if (!result) throw new Error(`Hoja de ruta ${id} no encontrada después de actualizar`);
    return result;
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Primero eliminar las cargas relacionadas
    await supabase.from('hoja_ruta_remitos').delete().eq('hoja_ruta_id', id);
    
    // Luego eliminar la hoja de ruta
    const { error } = await supabase
      .from('hojas_ruta')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting hoja de ruta: ${error.message}`);
    }
  }

  async agregarCarga(hojaId: string, carga: {
    remitente: string;
    remitoId: string;
    cliente: string;
    direccion: string;
    whatsapp?: string;
    bultos: number;
  }): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    // Insertar la carga en la tabla de relación
    const { error } = await supabase
      .from('hoja_ruta_remitos')
      .insert({
        hoja_ruta_id: hojaId,
        remito_id: carga.remitoId,
        orden: 0,
        estado_entrega: 'En Base',
      });
    
    if (error) {
      throw new Error(`Error adding carga: ${error.message}`);
    }
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de agregar carga`);
    return result;
  }

  async actualizarEstadoRemito(hojaId: string, remitoId: string, estado: string, motivoRechazo?: string, notasRechazo?: string): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    logger.debug('[Repository] update_remito_estado RPC - params: %o', {
      hojaId, 
      remitoRelacionId: remitoId, 
      estado, 
      motivoRechazo, 
      notasRechazo 
    });

    const { error } = await supabase.rpc('update_remito_estado', {
      p_hoja_ruta_id: hojaId,
      p_remito_relacion_id: remitoId,
      p_nuevo_estado: estado,
      p_motivo_rechazo: motivoRechazo || null,
      p_notas_rechazo: notasRechazo || null
    });

    if (error) {
      logger.error('[Repository] Error update_remito_estado RPC: %o', error);
      throw new Error(`Error actualizando estado del remito: ${error.message}`);
    }
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de actualizar estado de remito`);
    return result;
  }


  async iniciarTurno(hojaId: string, kmSalida: number): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.rpc('iniciar_turno_hoja_ruta', {
      p_hoja_ruta_id: hojaId,
      p_km_salida: kmSalida
    });

    if (error) {
      logger.error('[Repository] Error iniciar_turno_hoja_ruta: %o', error);
      throw new Error(`Error al iniciar turno: ${error.message}`);
    }

    // Registrar evento de tracking: En reparto
    await this.registrarTrackingEvent(hojaId, 'En reparto', 'en_reparto', 'El chofer inició el turno y comenzó el reparto', 'En ruta');
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de iniciar turno`);
    return result;
  }

  async terminarTurno(hojaId: string, kmLlegada: number): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.rpc('terminar_turno_hoja_ruta', {
      p_hoja_ruta_id: hojaId,
      p_km_llegada: kmLlegada
    });

    if (error) {
      logger.error('[Repository] Error terminar_turno_hoja_ruta: %o', error);
      throw new Error(`Error al terminar turno: ${error.message}`);
    }

    // Registrar evento de tracking: turno terminado
    await this.registrarTrackingEvent(hojaId, 'Unidad libre', 'turno_terminado', 'El chofer terminó el turno y regresó a base', 'Centro de distribución');
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de terminar turno`);
    return result;
  }

  async confirmarCompletada(hojaId: string): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    // Verificar que todas las entregas estén completas antes de llamar al RPC (opcional, pero buena práctica)
    const hoja = await this.findById(hojaId);
    const cargasCompletas = hoja?.cargas.every(c => c.estado === 'Entregado' || c.estado === 'Rechazado');
    if (!cargasCompletas) {
      throw new Error('Todas las entregas deben estar completadas (entregadas o rechazadas) antes de confirmar');
    }

    const { error } = await supabase.rpc('confirmar_hoja_completada', {
      p_hoja_ruta_id: hojaId
    });

    if (error) {
      logger.error('[Repository] Error confirmar_hoja_completada: %o', error);
      throw new Error(`Error al confirmar hoja: ${error.message}`);
    }

    // Registrar evento de tracking para cada remito en la hoja
    await this.registrarTrackingEvent(hojaId, 'Completada', 'hoja_completada', 'La hoja de ruta fue confirmada como completada por el chofer', 'Centro de distribución');
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de confirmar completada`);
    return result;
  }

  // Método auxiliar para registrar eventos de tracking para todos los remitos de una hoja
  private async registrarTrackingEvent(hojaId: string, estado: string, evento: string, descripcion: string, ubicacion: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Obtener todos los remitos de esta hoja con su tracking code
    const { data: cargas } = await supabase
      .from('hoja_ruta_remitos')
      .select(`
        remito_id,
        remitos(seguimiento)
      `)
      .eq('hoja_ruta_id', hojaId);

    if (cargas && cargas.length > 0) {
      for (const carga of cargas) {
        const trackingCode = (carga as any).remitos?.seguimiento;
        if (trackingCode) {
          const { error } = await supabase
            .from('tracking_events')
            .insert({
              remito_id: carga.remito_id,
              tracking_code: trackingCode,
              estado,
              evento,
              descripcion,
              ubicacion,
            });

          if (error) {
            logger.error('Error registering tracking event %s: %o', evento, error);
          }
        }
      }
    }
  }

  // Métodos auxiliares
  private mapCargaToEntity(row: any): RemitoHoja {
    return {
      id: row.id,
      remitoId: row.remito?.id || row.remito_id,
      cliente: row.remito?.destinatario || '',
      direccion: row.remito?.direccion || '',
      whatsapp: row.remito?.whatsapp,
      bultos: row.remito?.bultos || 0,
      estado: this.mapEstadoEntrega(row.estado_entrega),
      motivoRechazo: row.motivo_rechazo,
      notasRechazo: row.notas_rechazo,
    };
  }

  private async getCargasByHojaId(hojaId: string): Promise<RemitoHoja[]> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('hoja_ruta_remitos')
      .select(`
        id,
        orden,
        estado_entrega,
        fecha_entrega,
        remito:remitos(
          id,
          destinatario,
          direccion,
          whatsapp,
          bultos
        )
      `)
      .eq('hoja_ruta_id', hojaId)
      .order('orden', { ascending: true });
    
    if (error) {
      logger.error('Error fetching cargas: %o', error);
      return [];
    }
    
    return data?.map((row: any) => ({
      id: row.id,
      remitoId: row.remito?.id,
      cliente: row.remito?.destinatario || '',
      direccion: row.remito?.direccion || '',
      whatsapp: row.remito?.whatsapp,
      bultos: row.remito?.bultos || 0,
      estado: this.mapEstadoEntrega(row.estado_entrega),
      motivoRechazo: row.motivo_rechazo,
      notasRechazo: row.notas_rechazo,
    })) || [];
  }

  private mapEstadoEntrega(estado: string): 'En Base' | 'En reparto' | 'Entregado' | 'Rechazado' {
    switch (estado?.toLowerCase()) {
      case 'entregado': return 'Entregado';
      case 'rechazado': return 'Rechazado';
      case 'pendiente': return 'En Base';
      case 'en reparto': return 'En reparto';
      default: return 'En Base';
    }
  }

  private mapToEntity(row: any): HojaDeRuta {
    return {
      id: row.id,
      sscc: row.sscc,
      unidad: row.unidad,
      chofer: row.chofer,
      acompanante: row.acompanante,
      depositoOrigenId: row.deposito_origen_id,
      tipoFlota: row.tipo_flota || 'propia',
      tipoServicio: row.tipo_servicio || 'corta_distancia',
      cargas: [], // Se carga después con getCargasByHojaId
      fechaCreacion: new Date(row.created_at),
      estado: this.mapEstado(row.estado),
      kmSalida: row.km_salida,
      kmLlegada: row.km_llegada,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapEstado(estado: string): 'Lista para salir' | 'En reparto' | 'Finalizó reparto' | 'Unidad libre' | 'Completada' {
    // Primero verificar si ya está en español (formato actual de la DB)
    if (estado === 'Lista para salir' || estado === 'En reparto' || estado === 'Finalizó reparto' || estado === 'Unidad libre' || estado === 'Completada') {
      return estado;
    }
    // Luego verificar SNAKE_CASE (formato legacy)
    switch (estado) {
      case 'LISTA_PARA_SALIR': return 'Lista para salir';
      case 'EN_REPARTO': return 'En reparto';
      case 'FINALIZO_REPARTO': return 'Finalizó reparto';
      case 'UNIDAD_LIBRE': return 'Unidad libre';
      case 'COMPLETADA': return 'Completada';
      default: return 'Lista para salir';
    }
  }

  private mapEstadoToDB(estado: string): string {
    // La base de datos espera los valores en español
    const estadosValidos = [
      'preparando',
      'Lista para salir',
      'En reparto',
      'Finalizó reparto',
      'Unidad libre',
      'Completada',
    ];
    
    if (estadosValidos.includes(estado)) {
      return estado;
    }
    
    // Mapear variantes que puedan llegar
    switch (estado) {
      case 'LISTA_PARA_SALIR': return 'Lista para salir';
      case 'EN_REPARTO': return 'En reparto';
      case 'FINALIZO_REPARTO': return 'Finalizó reparto';
      case 'UNIDAD_LIBRE': return 'Unidad libre';
      case 'COMPLETADA': return 'Completada';
      default: return 'Lista para salir';
    }
  }
}

export const hojaDeRutaRepository = new SupabaseHojaDeRutaRepository();