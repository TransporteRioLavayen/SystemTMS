// =============================================================================
// CONTROLLER: HOJA DE RUTA - BACKEND
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de hojas de ruta

import { Request, Response, NextFunction } from 'express';
import { ListHojasDeRutaUseCase } from '../../application/use-cases/list-hojas-ruta.use-case';
import { GetHojaDeRutaByIdUseCase } from '../../application/use-cases/get-hoja-ruta-by-id.use-case';
import { CreateHojaDeRutaUseCase } from '../../application/use-cases/create-hoja-ruta.use-case';
import { UpdateHojaDeRutaUseCase } from '../../application/use-cases/update-hoja-ruta.use-case';
import { IniciarTurnoUseCase } from '../../application/use-cases/iniciar-turno.use-case';
import { TerminarTurnoUseCase } from '../../application/use-cases/terminar-turno.use-case';
import { ListFlotaDisponibleUseCase } from '../../application/use-cases/list-flota-disponible.use-case';
import { hojaDeRutaRepository } from '../../infrastructure/repositories/supabase-hoja-ruta.repository';
import { unidadRepository } from '../../infrastructure/repositories/supabase-unidad.repository';
import { terceroRepository } from '../../infrastructure/repositories/supabase-tercero.repository';
import { logger } from '../../infrastructure/logging/logger';

// Instancias de use cases
const listHojasDeRutaUseCase = new ListHojasDeRutaUseCase(hojaDeRutaRepository);
const getHojaDeRutaByIdUseCase = new GetHojaDeRutaByIdUseCase(hojaDeRutaRepository);
const createHojaDeRutaUseCase = new CreateHojaDeRutaUseCase(hojaDeRutaRepository);
const updateHojaDeRutaUseCase = new UpdateHojaDeRutaUseCase(hojaDeRutaRepository);
const iniciarTurnoUseCase = new IniciarTurnoUseCase(hojaDeRutaRepository);
const terminarTurnoUseCase = new TerminarTurnoUseCase(hojaDeRutaRepository);
const listFlotaDisponibleUseCase = new ListFlotaDisponibleUseCase(unidadRepository, terceroRepository);

export class HojaDeRutaController {
  
  /**
   * GET /api/hojas-ruta
   * Lista todas las hojas de ruta o filtra por estado (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const estado = req.query.estado as string | undefined;
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: hojas, total } = await listHojasDeRutaUseCase.executePaginated({ offset, limit, estado });
      
      res.json({
        success: true,
        data: hojas,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hojas-ruta/flota-disponible
   * Lista unidades propias y terceros disponibles para crear hojas de ruta
   */
  async flotaDisponible(req: Request, res: Response, next: NextFunction) {
    try {
      const tipoServicio = req.query.tipoServicio as string | undefined;
      const flota = await listFlotaDisponibleUseCase.execute(tipoServicio);
      
      res.json({
        success: true,
        data: flota,
        count: flota.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hojas-ruta/:id
   * Obtiene una hoja de ruta por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const hoja = await getHojaDeRutaByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: hoja,
      });
    } catch (error: any) {
      if (error.message === 'Hoja de ruta no encontrada') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/hojas-ruta
   * Crea una nueva hoja de ruta
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const nuevaHoja = await createHojaDeRutaUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevaHoja,
        message: 'Hoja de ruta creada exitosamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/hojas-ruta/:id
   * Actualiza una hoja de ruta
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const actualizada = await updateHojaDeRutaUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizada,
        message: 'Hoja de ruta actualizada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Hoja de ruta no encontrada') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/hojas-ruta/:id/iniciar-turno
   * Inicia el turno de una hoja de ruta (Lista para salir -> En reparto)
   */
  async iniciarTurno(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kmSalida } = req.body;
      
      const hoja = await iniciarTurnoUseCase.execute(id, kmSalida);
      
      res.json({
        success: true,
        data: hoja,
        message: 'Turno iniciado exitosamente',
      });
    } catch (error: any) {
      if (error.message.includes('no encontrada') || error.message.includes('debe estar')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/hojas-ruta/:id/terminar-turno
   * Termina el turno de una hoja de ruta (En reparto -> Unidad libre)
   */
  async terminarTurno(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kmLlegada } = req.body;
      
      const hoja = await terminarTurnoUseCase.execute(id, kmLlegada);
      
      res.json({
        success: true,
        data: hoja,
        message: 'Turno terminado exitosamente',
      });
    } catch (error: any) {
      if (error.message.includes('no encontrada') || error.message.includes('debe estar')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/hojas-ruta/:id/agregar-carga
   * Agrega una carga/remito a la hoja de ruta
   */
  async agregarCarga(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const carga = req.body;
      
      const hoja = await hojaDeRutaRepository.agregarCarga(id, carga);
      
      res.json({
        success: true,
        data: hoja,
        message: 'Carga agregada exitosamente',
      });
    } catch (error: any) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/hojas-ruta/:id/remitos/:remitoId/estado
   * Actualiza el estado de un remito en la hoja de ruta
   */
  async actualizarEstadoRemito(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, remitoId } = req.params;
      const { estado, motivoRechazo, notasRechazo } = req.body;
      
      logger.debug('[Controller] actualizarEstadoRemito: %o', {
        hojaId: id,
        remitoId: remitoId,
        estado: estado,
        motivoRechazo,
        notasRechazo
      });
      
      const hoja = await hojaDeRutaRepository.actualizarEstadoRemito(id, remitoId, estado, motivoRechazo, notasRechazo);
      
      res.json({
        success: true,
        data: hoja,
        message: 'Estado de remito actualizado exitosamente',
      });
    } catch (error: any) {
      logger.error('[Controller] Error actualizarEstadoRemito: %s', error.message);
      if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/hojas-ruta/chofer/:dni
   * Obtiene las hojas de ruta asignadas a un chofer por su DNI
   */
  async findByChoferDni(req: Request, res: Response, next: NextFunction) {
    try {
      const { dni } = req.params;
      
      const hojas = await hojaDeRutaRepository.findByChoferDni(dni);
      
      res.json({
        success: true,
        data: hojas,
        message: 'Hojas de ruta del chofer encontradas',
      });
    } catch (error: any) {
      logger.error('[Controller] Error findByChoferDni: %s', error.message);
      next(error);
    }
  }

  /**
   * PATCH /api/hojas-ruta/:id/confirmar-completada
   * Confirma una hoja de ruta como completada
   */
  async confirmarCompletada(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      logger.debug('[Controller] confirmarCompletada: %o', { hojaId: id });
      
      const hoja = await hojaDeRutaRepository.confirmarCompletada(id);
      
      res.json({
        success: true,
        data: hoja,
        message: 'Hoja de ruta confirmada como completada',
      });
    } catch (error: any) {
      logger.error('[Controller] Error confirmarCompletada: %s', error.message);
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }
}

// Exportar instancia del controlador
export const hojaDeRutaController = new HojaDeRutaController();