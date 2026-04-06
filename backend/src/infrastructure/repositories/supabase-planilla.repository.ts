// =============================================================================
// SUPABASE PLANILLA REPOSITORY - BACKEND
// =============================================================================

import { getSupabaseClient } from '../database/supabase/client';
import { Planilla, Remito } from '../../domain/entities/planilla.entity';
import { IPlanillaRepository } from '../../domain/repositories/planilla.repository.interface';
import { logger } from '../logging/logger';

export class SupabasePlanillaRepository implements IPlanillaRepository {
  async findAll(includeInactivos: boolean = false): Promise<Planilla[]> {
    const result = await this.findAllPaginated({ offset: 0, limit: 10000 });
    return result.data;
  }

  async findAllPaginated(options: { offset: number; limit: number; estado?: string }): Promise<{ data: Planilla[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from('planillas').select('*', { count: 'exact' });
    
    if (options.estado) {
      query = query.eq('estado', options.estado);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) {
      throw new Error(`Error fetching planillas: ${error.message}`);
    }
    
    const planillas = data?.map(this.mapToEntity) || [];
    
    // FIX N+1: Una sola query con .in() en vez de loop
    if (planillas.length > 0) {
      const planillaIds = planillas.map(p => p.id);
      const { data: remitosData } = await supabase
        .from('remitos')
        .select('*')
        .in('planilla_id', planillaIds);
      
      // Agrupar remitos por planilla_id
      const remitosByPlanilla = new Map<string, Remito[]>();
      for (const remito of (remitosData || [])) {
        const pid = remito.planilla_id;
        if (!remitosByPlanilla.has(pid)) {
          remitosByPlanilla.set(pid, []);
        }
        remitosByPlanilla.get(pid)!.push(this.mapRemitoToEntity(remito));
      }
      
      // Asignar remitos a cada planilla
      for (const planilla of planillas) {
        planilla.remitos = remitosByPlanilla.get(planilla.id) || [];
      }
    }
    
    return {
      data: planillas,
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Planilla | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('planillas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching planilla: ${error.message}`);
    }
    
    const planilla = this.mapToEntity(data);
    // Cargar remitos relacionados
    planilla.remitos = await this.getRemitosByPlanillaId(id);
    
    return planilla;
  }

  async findByEstado(estado: string): Promise<Planilla[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('planillas')
      .select('*')
      .eq('estado', estado)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching planillas by estado: ${error.message}`);
    }
    
    const planillas = data?.map(this.mapToEntity) || [];
    
    // FIX N+1: Una sola query con .in()
    if (planillas.length > 0) {
      const planillaIds = planillas.map(p => p.id);
      const { data: remitosData } = await supabase
        .from('remitos')
        .select('*')
        .in('planilla_id', planillaIds);
      
      const remitosByPlanilla = new Map<string, Remito[]>();
      for (const remito of (remitosData || [])) {
        const pid = remito.planilla_id;
        if (!remitosByPlanilla.has(pid)) {
          remitosByPlanilla.set(pid, []);
        }
        remitosByPlanilla.get(pid)!.push(this.mapRemitoToEntity(remito));
      }
      
      for (const planilla of planillas) {
        planilla.remitos = remitosByPlanilla.get(planilla.id) || [];
      }
    }
    
    return planillas;
  }

  // Método para obtener remitos por estado
  async findRemitosByEstado(estado: string): Promise<Array<{
    id: string;
    remitente: string;
    numeroRemito: string;
    destinatario: string;
    bultos: number;
    valorDeclarado: number;
    seguimiento?: string;
    direccion?: string;
    whatsapp?: string;
    estado: string;
    resultado?: string;
    planillaId?: string;
  }>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('remitos')
      .select('*')
      .eq('estado', estado)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching remitos by estado: %o', error);
      return [];
    }
    
    return data?.map((row: any) => ({
      id: row.id,
      remitente: row.remitente,
      numeroRemito: row.numero_remito,
      destinatario: row.destinatario,
      bultos: row.bultos,
      valorDeclarado: row.valor_declarado,
      seguimiento: row.seguimiento,
      direccion: row.direccion,
      whatsapp: row.whatsapp,
      estado: row.estado,
      resultado: row.resultado,
      planillaId: row.planilla_id,
    })) || [];
  }

  // Método auxiliar para obtener remitos de una planilla
  private async getRemitosByPlanillaId(planillaId: string): Promise<Remito[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('remitos')
      .select('*')
      .eq('planilla_id', planillaId);
    
    if (error) {
      logger.error('Error fetching remitos: %o', error);
      return [];
    }
    
    return data?.map(this.mapRemitoToEntity) || [];
  }

  // Mapear remito de la DB a la entidad
  private mapRemitoToEntity(row: any): Remito {
    return {
      id: row.id,
      remitente: row.remitente,
      numeroRemito: row.numero_remito,
      destinatario: row.destinatario,
      bultos: row.bultos,
      valorDeclarado: row.valor_declarado,
      seguimiento: row.seguimiento,
      direccion: row.direccion,
      whatsapp: row.whatsapp,
      estado: row.estado,
      resultado: row.resultado,
      // Campos de control
      bultosRecibidos: row.bultos_recibidos,
      pesoTotal: row.peso_total,
    };
  }

  async create(planilla: Omit<Planilla, 'id' | 'createdAt' | 'updatedAt'>): Promise<Planilla> {
    const supabase = getSupabaseClient();
    
    // Formatear remitos para el RPC
    const remitosPayload = (planilla.remitos || []).map(r => ({
      remitente: r.remitente,
      numero_remito: r.numeroRemito,
      destinatario: r.destinatario,
      direccion: r.direccion || null,
      whatsapp: r.whatsapp || null,
      bultos: r.bultos || 1,
      valor_declarado: r.valorDeclarado || 0,
      seguimiento: r.seguimiento || null,
      estado: 'Ingresado'
    }));

    // Ejecutar RPC para creación atómica
    const { data: planillaId, error } = await supabase.rpc('create_planilla_with_remitos', {
      p_sucursal_origen: planilla.sucursalOrigen,
      p_sucursal_destino: planilla.sucursalDestino || null,
      p_fecha_salida: planilla.fechaSalidaEstimada || null,
      p_fecha_llegada: planilla.fechaLlegadaEstimada || null,
      p_camion: planilla.camion || null,
      p_chofer: planilla.chofer || null,
      p_estado: planilla.estado || 'borrador',
      p_comentarios: planilla.comentarios || null,
      p_km_salida: planilla.kmSalida || null,
      p_remitos: remitosPayload
    });

    if (error) {
      logger.error('Error in create_planilla_with_remitos RPC: %o', error);
      throw new Error(`Error creating planilla: ${error.message}`);
    }

    // Obtener la planilla completa creada (incluyendo remitos mapeados)
    const result = await this.findById(planillaId);
    if (!result) {
      throw new Error('Planilla no encontrada después de la creación atómica');
    }
    
    return result;
  }

  // Método para crear un remito relacionado a una planilla
  private async createRemito(planillaId: string, remito: Remito): Promise<Remito> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('remitos')
      .insert({
        planilla_id: planillaId,
        remitente: remito.remitente,
        numero_remito: remito.numeroRemito,
        destinatario: remito.destinatario,
        direccion: remito.direccion || null,
        whatsapp: remito.whatsapp || null,
        bultos: remito.bultos || 1,
        valor_declarado: remito.valorDeclarado || 0,
        seguimiento: remito.seguimiento || null,
        estado: 'Ingresado',
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating remito: %o', error);
      throw new Error(`Error creating remito: ${error.message}`);
    }
    
    return this.mapRemitoToEntity(data);
  }

  async update(id: string, planilla: Partial<Planilla>): Promise<Planilla> {
    const supabase = getSupabaseClient();
    const updateData: any = {};
    
    if (planilla.sucursalOrigen !== undefined) updateData.sucursal_origen = planilla.sucursalOrigen;
    if (planilla.sucursalDestino !== undefined) updateData.sucursal_destino = planilla.sucursalDestino;
    if (planilla.fechaSalidaEstimada !== undefined) updateData.fecha_salida_estimada = planilla.fechaSalidaEstimada;
    if (planilla.fechaLlegadaEstimada !== undefined) updateData.fecha_llegada_estimada = planilla.fechaLlegadaEstimada;
    if (planilla.camion !== undefined) updateData.camion = planilla.camion;
    if (planilla.chofer !== undefined) updateData.chofer = planilla.chofer;
    if (planilla.estado !== undefined) updateData.estado = planilla.estado;
    if (planilla.comentarios !== undefined) updateData.comentarios = planilla.comentarios;
    if (planilla.kmSalida !== undefined) updateData.km_salida = planilla.kmSalida;
    if (planilla.kmLlegada !== undefined) updateData.km_llegada = planilla.kmLlegada;

    const { data, error } = await supabase
      .from('planillas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating planilla: ${error.message}`);
    }
    
    const planillaActualizada = this.mapToEntity(data);
    
    // Si se actualizaron los remitos, actualizar en la tabla de remitos
    if (planilla.remitos !== undefined) {
      // Eliminar remitos existentes
      await supabase.from('remitos').delete().eq('planilla_id', id);
      
      // Crear los nuevos remitos
      for (const remito of planilla.remitos) {
        await this.createRemito(id, remito);
      }
    }
    
    // Cargar remitos actualizados
    planillaActualizada.remitos = await this.getRemitosByPlanillaId(id);
    
    return planillaActualizada;
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Primero eliminar los remitos relacionados
    await supabase.from('remitos').delete().eq('planilla_id', id);
    
    // Luego eliminar la planilla
    const { error } = await supabase
      .from('planillas')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting planilla: ${error.message}`);
    }
  }

  // Método para actualizar un remito con datos de control
  private async updateRemitoControl(remitoId: string, data: {
    bultos_recibidos: number;
    peso_total: number;
    direccion: string;
    whatsapp: string;
    estado?: string;
  }): Promise<void> {
    const supabase = getSupabaseClient();
    const updateData: any = {
      bultos_recibidos: data.bultos_recibidos,
      peso_total: data.peso_total,
      direccion: data.direccion,
      whatsapp: data.whatsapp,
    };
    
    // Actualizar estado si se proporciona
    if (data.estado) {
      updateData.estado = data.estado;
    }
    
    const { error } = await supabase
      .from('remitos')
      .update(updateData)
      .eq('id', remitoId);

    if (error) {
      logger.error('Error updating remito control: %o', error);
      throw new Error(`Error updating remito: ${error.message}`);
    }
  }

  // Método para generar código de seguimiento único (TRK-XXXXX)
  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TRK-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Método para generar seguimiento para todos los remitos de una planilla
  async generarSeguimientoRemitos(planillaId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Obtener los remitos sin seguimiento
    const { data: remitos, error } = await supabase
      .from('remitos')
      .select('id, seguimiento')
      .eq('planilla_id', planillaId)
      .is('seguimiento', null);

    if (error) {
      throw new Error(`Error fetching remitos: ${error.message}`);
    }

    // Generar seguimiento para cada remito
    if (remitos && remitos.length > 0) {
      for (const remito of remitos) {
        const seguimiento = this.generateTrackingCode();
        
        const { error: updateError } = await supabase
          .from('remitos')
          .update({ seguimiento, estado: 'En viaje' })
          .eq('id', remito.id);

        if (updateError) {
          logger.error('Error generating tracking for remito: %o', updateError);
          throw new Error(`Error generating tracking: ${updateError.message}`);
        }

        // Registrar evento de tracking: seguimiento generado
        const { error: trackingError } = await supabase
          .from('tracking_events')
          .insert({
            remito_id: remito.id,
            tracking_code: seguimiento,
            estado: 'En viaje',
            evento: 'viaje_confirmado',
            descripcion: 'La planilla fue confirmada y el remito entró en ciclo de envío',
            ubicacion: 'Centro de distribución',
          });

        if (trackingError) {
          logger.error('Error registering tracking event: %o', trackingError);
        }
      }
    }
  }

  async finalizarControl(id: string, remitos: Array<{
    id: string;
    bultosRecibidos: number;
    pesoTotal: number;
    direccion: string;
    whatsapp: string;
  }>): Promise<Planilla> {
    const supabase = getSupabaseClient();
    
    // 1. Obtener la planilla actual
    const planillaActual = await this.findById(id);
    if (!planillaActual) {
      throw new Error('Planilla no encontrada');
    }

    // 2. Verificar que la planilla esté en estado 'control'
    if (planillaActual.estado !== 'control') {
      throw new Error('La planilla debe estar en estado "control" para finalizar el control');
    }

    // 3. Actualizar cada remito con los datos de control
    let hayDiferencia = false;
    for (const remitoControl of remitos) {
      const remitoOriginal = planillaActual.remitos.find(r => r.id === remitoControl.id);
      if (!remitoOriginal) {
        throw new Error(`Remito ${remitoControl.id} no encontrado en la planilla`);
      }

      // Verificar si hay diferencia de bultos
      if (remitoControl.bultosRecibidos !== remitoOriginal.bultos) {
        hayDiferencia = true;
      }

      // Actualizar el remito en la DB
      await this.updateRemitoControl(remitoControl.id, {
        bultos_recibidos: remitoControl.bultosRecibidos,
        peso_total: remitoControl.pesoTotal,
        direccion: remitoControl.direccion,
        whatsapp: remitoControl.whatsapp,
        estado: 'Preparado',
      });
    }

    // 4. Determinar el nuevo estado (completo si todo coincide, incompleto si hay diferencia)
    const nuevoEstado = hayDiferencia ? 'incompleto' : 'completo';

    // 5. Actualizar la planilla con el nuevo estado
    const { data, error } = await supabase
      .from('planillas')
      .update({ estado: nuevoEstado })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating planilla state: ${error.message}`);
    }

    // 6. Registrar evento de tracking: Clasificación
    await this.registrarTrackingClasificacion(id);

    // 7. Devolver la planilla actualizada con sus remitos
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Planilla no encontrada después de finalizar el control');
    }
    return result;
  }

  private mapToEntity(row: any): Planilla {
    return {
      id: row.id,
      sucursalOrigen: row.sucursal_origen,
      sucursalDestino: row.sucursal_destino,
      fechaSalidaEstimada: row.fecha_salida_estimada,
      fechaLlegadaEstimada: row.fecha_llegada_estimada,
      camion: row.camion,
      chofer: row.chofer,
      remitos: [], // Se carga después con getRemitosByPlanillaId
      estado: row.estado,
      comentarios: row.comentarios,
      kmSalida: row.km_salida,
      kmLlegada: row.km_llegada,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // =============================================================================
  // TRACKING METHODS
  // =============================================================================

  async registrarTrackingLlegada(planillaId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    const { data: remitos } = await supabase
      .from('remitos')
      .select('id, seguimiento')
      .eq('planilla_id', planillaId)
      .not('seguimiento', 'is', null);

    if (remitos && remitos.length > 0) {
      for (const remito of remitos) {
        await supabase.from('tracking_events').insert({
          remito_id: remito.id,
          tracking_code: remito.seguimiento,
          estado: 'En Casa Central',
          evento: 'llegada_casa_central',
          descripcion: 'La carga llegó a casa central y está lista para control',
          ubicacion: 'Casa central',
        });
      }
    }
  }

  async registrarTrackingClasificacion(planillaId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    const { data: remitos } = await supabase
      .from('remitos')
      .select('id, seguimiento')
      .eq('planilla_id', planillaId)
      .not('seguimiento', 'is', null);

    if (remitos && remitos.length > 0) {
      for (const remito of remitos) {
        await supabase.from('tracking_events').insert({
          remito_id: remito.id,
          tracking_code: remito.seguimiento,
          estado: 'Preparado',
          evento: 'clasificacion',
          descripcion: 'El remito fue controlado y está preparado para hoja de ruta',
          ubicacion: 'Centro de distribución',
        });
      }
    }
  }

  async getTrackingByCode(trackingCode: string): Promise<Array<{
    id: string;
    remito_id: string;
    tracking_code: string;
    estado: string;
    evento: string;
    descripcion: string;
    ubicacion: string;
    created_at: string;
  }>> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('tracking_code', trackingCode)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching tracking events: %o', error);
      return [];
    }

    return data || [];
  }

  async getRemitoByTracking(trackingCode: string): Promise<{
    id: string;
    destinatario: string;
    direccion: string;
    bultos: number;
    seguimiento: string;
    estado: string;
  } | null> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('remitos')
      .select('id, destinatario, direccion, bultos, seguimiento, estado')
      .eq('seguimiento', trackingCode)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      destinatario: data.destinatario,
      direccion: data.direccion || '',
      bultos: data.bultos,
      seguimiento: data.seguimiento,
      estado: data.estado,
    };
  }
}

export const planillaRepository = new SupabasePlanillaRepository();
