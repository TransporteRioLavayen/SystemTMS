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
    const result = await this.findAllPaginated({ offset: 0, limit: 50, estado }); // OPTIMIZACIÓN: límite razonable
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: HojaDeRuta[]; total: number }> {
    const supabase = getSupabaseClient();
    
    // OPTIMIZACIÓN: Especificar columnas necesarias
    let query = supabase
      .from('hojas_ruta')
      .select('id, unidad, chofer, acompanante, estado, km_salida, km_llegada, fecha_inicio, fecha_fin, created_at, deposito_origen_id, tipo_flota, tipo_servicio, sscc', { count: 'exact' })
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
      .select('id, unidad, chofer, acompanante, estado, km_salida, km_llegada, fecha_inicio, fecha_fin, created_at, deposito_origen_id, tipo_flota, tipo_servicio, sscc')
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
      .select('id, unidad, chofer, acompanante, estado, km_salida, km_llegada, fecha_inicio, fecha_fin, created_at, deposito_origen_id, tipo_flota, tipo_servicio, sscc')
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
    
    // Generar SSCC único para la hoja de ruta
    const sscc = this.generateSSCC();
    
    logger.info('[Repository] create hoja de ruta: unidad=%s, chofer=%s, estado=%s, sscc=%s', 
      hoja.unidad, hoja.chofer, estadoDB, sscc);
    
    // 1. Insertar la hoja de ruta directamente (no usa RPC)
    const { data: hojaData, error: hojaError } = await supabase
      .from('hojas_ruta')
      .insert({
        unidad: hoja.unidad,
        chofer: hoja.chofer,
        acompanante: hoja.acompanante || null,
        deposito_origen_id: hoja.depositoOrigenId || null,
        tipo_flota: hoja.tipoFlota || 'propia',
        tipo_servicio: hoja.tipoServicio || 'corta_distancia',
        estado: estadoDB,
        sscc: sscc
      })
      .select()
      .single();

    if (hojaError) {
      logger.error('[Repository] Error creating hoja de ruta: code=%s, message=%s, details=%o', 
        hojaError.code, hojaError.message, hojaError.details);
      throw new Error(`Error creating hoja de ruta: ${hojaError.message}`);
    }

    const hojaId = hojaData.id;
    logger.info('[Repository] Hoja de ruta creada con ID: %s, SSCC: %s', hojaId, sscc);

    // 2. Insertar las cargas (remitos asociados) directamente
    const cargas = hoja.cargas || [];
    if (cargas.length > 0) {
      const cargasPayload = cargas.map((c, index) => ({
        hoja_ruta_id: hojaId,
        remito_id: c.remitoId || c.id,
        orden: index + 1,
        estado_entrega: 'En Base'
      }));

      const { error: cargasError } = await supabase
        .from('hoja_ruta_remitos')
        .insert(cargasPayload);

      if (cargasError) {
        logger.error('[Repository] Error inserting cargas: %o', cargasError);
        // Rollback: eliminar la hoja creada
        await supabase.from('hojas_ruta').delete().eq('id', hojaId);
        throw new Error(`Error inserting cargas: ${cargasError.message}`);
      }
      
      logger.info('[Repository] %d cargas asociadas a la hoja %s', cargas.length, hojaId);
    }

    // Registrar evento de tracking: Preparado (hoja de ruta creada)
    await this.registrarTrackingEvent(hojaId, 'Preparado', 'hoja_preparada', 'La hoja de ruta fue preparada y está lista para salir', 'Centro de distribución');
    
    // 3. Retornar la hoja creada con sus cargas
    const result = await this.findById(hojaId);
    if (!result) throw new Error('Hoja de ruta no encontrada después de crear');
    return result;
  }

  // Generador de SSCC para hojas de ruta (formato: HR-AAAAMMDD-XXXXXX)
  private generateSSCC(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const randomSeq = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `HR-${year}${month}${day}-${randomSeq}`;
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
    
    logger.info('[Repository] actualizarEstadoRemito - INICIO: hojaId=%s, remitoId=%s, estado=%s', hojaId, remitoId, estado);

    // Mapear estado al formato de la DB
    const estadoDB = this.mapEstadoEntregaToDB(estado);
    logger.info('[Repository] Estado mapeado: %s -> %s', estado, estadoDB);

    // DEBUG: Ver todos los registros y intentar match flexible
    logger.info('[Repository] === DEBUG: Buscando registros ===');
    logger.info('[Repository] hojaId: "%s"', hojaId);
    logger.info('[Repository] remitoId: "%s"', remitoId);
    
    // Ver todos los registros de hoja_ruta_remitos para esta hoja
    const { data: allRecords, error: debugError } = await supabase
      .from('hoja_ruta_remitos')
      .select('id, hoja_ruta_id, remito_id, estado_entrega')
      .eq('hoja_ruta_id', hojaId);
    
    if (debugError) {
      logger.error('[Repository] DEBUG error: %s', debugError.message);
    } else {
      logger.info('[Repository] DEBUG: Registros en esta hoja: %d', allRecords?.length || 0);
      if (allRecords) {
        allRecords.forEach(rec => {
          const match = rec.remito_id === remitoId ? ' <-- MATCH' : '';
          logger.info('[Repository] DEBUG: id=%s, remito_id=%s, estado=%s%s', 
            rec.id, rec.remito_id, rec.estado_entrega, match);
        });
      }
    }
    
    // Si no hay match exacto, intentar actualizar todos los registros de esa hoja con ese remitoId
    // (puede haber problema de UUIDs ligeramente diferentes)
    const matchingRecord = allRecords?.find(r => 
      r.remito_id.toLowerCase() === remitoId.toLowerCase()
    );
    
    if (matchingRecord) {
      logger.info('[Repository] Encontré registro con match. Actualizando ese...');
      remitoId = matchingRecord.remito_id;
    }
    
    // Usar el UUID directamente sin verificar primero (más eficiente)
    // Actualizar directamente el registro en hoja_ruta_remitos
    const { data, error } = await supabase
      .from('hoja_ruta_remitos')
      .update({
        estado_entrega: estadoDB,
        fecha_entrega: estadoDB === 'Entregado' ? new Date().toISOString() : null,
        motivo_rechazo: motivoRechazo || null,
        notas_rechazo: notasRechazo || null
      })
      .eq('hoja_ruta_id', hojaId)
      .eq('remito_id', remitoId);

    if (error) {
      logger.error('[Repository] Error actualizando estado remito: code=%s, message=%s', error.code, error.message);
      throw new Error(`Error actualizando estado del remito: ${error.message}`);
    }
    
    // Verificar cuántos registros se actualizaron (sin .select())
    const { count } = await supabase
      .from('hoja_ruta_remitos')
      .select('id', { count: 'exact', head: true })
      .eq('hoja_ruta_id', hojaId)
      .eq('remito_id', remitoId)
      .eq('estado_entrega', estadoDB);
    
    logger.info('[Repository] Remito actualizado. Rows affected: %d (verificado: %d)', data?.length || 0, count || 0);
    
    if (!count || count === 0) {
      logger.error('[Repository] NO se actualizó ningún registro. Estado: %s', estadoDB);
      throw new Error('No se pudo actualizar el estado del remito.');
    }
    
    // IMPORTANTE: Si el remito fue rechazado, también actualizar el estado en la tabla 'remitos'
    // para que aparezca en "Remitos No Entregados" en el panel del admin
    if (estadoDB === 'Rechazado') {
      logger.info('[Repository] Actualizando estado en tabla remitos a Por reasignar...');
      const { error: remitoError } = await supabase
        .from('remitos')
        .update({
          estado: 'Por reasignar',
          updated_at: new Date().toISOString()
        })
        .eq('id', remitoId);
      
      if (remitoError) {
        logger.error('[Repository] Error actualizando remito en tabla remitos: %o', remitoError);
      } else {
        logger.info('[Repository] Estado de remito actualizado a Por reasignar en tabla remitos');
      }
    }
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de actualizar estado de remito`);
    return result;
  }

  // Mapear estado de entrega a formato DB
  private mapEstadoEntregaToDB(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'entregado': return 'Entregado';
      case 'rechazado': return 'Rechazado';
      case 'en reparto':
      case 'en_reparto': return 'En Reparto';
      default: return 'En Base';
    }
  }


  async iniciarTurno(hojaId: string, kmSalida: number): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    logger.info('[Repository] iniciarTurno - hojaId: %s, kmSalida: %d', hojaId, kmSalida);

    // 1. Actualizar la hoja de ruta con km_salida y estado
    const { error } = await supabase
      .from('hojas_ruta')
      .update({
        km_salida: kmSalida,
        fecha_inicio: new Date().toISOString(),
        estado: 'En reparto'
      })
      .eq('id', hojaId);

    if (error) {
      logger.error('[Repository] Error iniciarTurno: %o', error);
      throw new Error(`Error al iniciar turno: ${error.message}`);
    }

    // 2. IMPORTANTE: Cambiar estado de todos los remitos de la hoja a "En Reparto"
    // Primero ver qué remitos hay
    const { data: remitosAntes } = await supabase
      .from('hoja_ruta_remitos')
      .select('id, estado_entrega')
      .eq('hoja_ruta_id', hojaId);
    
    logger.info('[Repository] Remitos antes de actualizar: %s', 
      remitosAntes?.map(r => `${r.id.slice(0,8)}: ${r.estado_entrega}`).join(', '));

    // Actualizar todos los remitos de esta hoja a "En Reparto"
    const { data, error: cargaError } = await supabase
      .from('hoja_ruta_remitos')
      .update({
        estado_entrega: 'En Reparto'
      })
      .eq('hoja_ruta_id', hojaId);

    if (cargaError) {
      logger.error('[Repository] Error actualizando remitos a En Reparto: %s', cargaError.message);
    } else {
      logger.info('[Repository] Remitos actualizados. Rows: %d', data?.length || 0);
    }
    
    // Verificar después
    const { data: remitosDespués } = await supabase
      .from('hoja_ruta_remitos')
      .select('id, estado_entrega')
      .eq('hoja_ruta_id', hojaId);
    
    logger.info('[Repository] Remitos después: %s', 
      remitosDespués?.map(r => `${r.id.slice(0,8)}: ${r.estado_entrega}`).join(', '));

    // Registrar evento de tracking: En reparto
    await this.registrarTrackingEvent(hojaId, 'En reparto', 'en_reparto', 'El chofer inició el turno y comenzó el reparto', 'En ruta');
    
    const result = await this.findById(hojaId);
    if (!result) throw new Error(`Hoja de ruta ${hojaId} no encontrada después de iniciar turno`);
    return result;
  }

  async terminarTurno(hojaId: string, kmLlegada: number): Promise<HojaDeRuta> {
    const supabase = getSupabaseClient();
    
    logger.info('[Repository] terminarTurno - hojaId: %s, kmLlegada: %d', hojaId, kmLlegada);

    // Actualizar directamente la hoja de ruta con km_llegada y estado
    const { error } = await supabase
      .from('hojas_ruta')
      .update({
        km_llegada: kmLlegada,
        fecha_fin: new Date().toISOString(),
        estado: 'Unidad libre'
      })
      .eq('id', hojaId);

    if (error) {
      logger.error('[Repository] Error terminarTurno: %o', error);
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
    
    // Verificar que todas las entregas estén completas
    const hoja = await this.findById(hojaId);
    const cargasCompletas = hoja?.cargas.every(c => c.estado === 'Entregado' || c.estado === 'Rechazado');
    if (!cargasCompletas) {
      throw new Error('Todas las entregas deben estar completadas (entregadas o rechazadas) antes de confirmar');
    }

    // Actualizar directamente el estado de la hoja
    const { error } = await supabase
      .from('hojas_ruta')
      .update({
        estado: 'Completada'
      })
      .eq('id', hojaId);

    if (error) {
      logger.error('[Repository] Error confirmarCompletada: %o', error);
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

  private mapEstadoEntrega(estado: string): 'En Base' | 'En Reparto' | 'Entregado' | 'Rechazado' {
    const estadoLower = estado?.toLowerCase();
    switch (estadoLower) {
      case 'entregado': return 'Entregado';
      case 'rechazado': return 'Rechazado';
      case 'en reparto': return 'En Reparto';  // DB puede tener 'En Reparto' o 'En reparto'
      case 'pendiente':
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