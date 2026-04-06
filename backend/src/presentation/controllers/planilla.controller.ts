// =============================================================================
// CONTROLLER: PLANILLA
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de planillas

import { Request, Response, NextFunction } from 'express';
import { ListPlanillasUseCase } from '../../application/use-cases/list-planillas.use-case';
import { GetPlanillaByIdUseCase } from '../../application/use-cases/get-planilla-by-id.use-case';
import { CreatePlanillaUseCase } from '../../application/use-cases/create-planilla.use-case';
import { UpdatePlanillaUseCase } from '../../application/use-cases/update-planilla.use-case';
import { DeletePlanillaUseCase } from '../../application/use-cases/delete-planilla.use-case';
import { ConfirmarViajeUseCase } from '../../application/use-cases/confirmar-viaje.use-case';
import { ConfirmarLlegadaUseCase } from '../../application/use-cases/confirmar-llegada.use-case';
import { FinalizarControlUseCase } from '../../application/use-cases/finalizar-control.use-case';
import { FinalizarControlDto } from '../../application/dto/finalizar-control.dto';
import { planillaRepository } from '../../infrastructure/repositories/supabase-planilla.repository';
import { logger } from '../../infrastructure/logging/logger';

// Instancias de use cases
const listPlanillasUseCase = new ListPlanillasUseCase(planillaRepository);
const getPlanillaByIdUseCase = new GetPlanillaByIdUseCase(planillaRepository);
const createPlanillaUseCase = new CreatePlanillaUseCase(planillaRepository);
const updatePlanillaUseCase = new UpdatePlanillaUseCase(planillaRepository);
const deletePlanillaUseCase = new DeletePlanillaUseCase(planillaRepository);
const confirmarViajeUseCase = new ConfirmarViajeUseCase(planillaRepository);
const confirmarLlegadaUseCase = new ConfirmarLlegadaUseCase(planillaRepository);
const finalizarControlUseCase = new FinalizarControlUseCase(planillaRepository);

export class PlanillaController {
  
  /**
   * GET /api/planillas
   * Lista todas las planillas o filtra por estado (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const estado = req.query.estado as string | undefined;
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: planillas, total } = await listPlanillasUseCase.executePaginated({ offset, limit, estado });
      
      res.json({
        success: true,
        data: planillas,
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
   * GET /api/planillas/:id
   * Obtiene una planilla por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const planilla = await getPlanillaByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: planilla,
      });
    } catch (error: any) {
      if (error.message === 'Planilla no encontrada') {
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
   * POST /api/planillas
   * Crea una nueva planilla
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const nuevaPlanilla = await createPlanillaUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevaPlanilla,
        message: 'Planilla creada exitosamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/planillas/:id
   * Actualiza una planilla
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const actualizada = await updatePlanillaUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizada,
        message: 'Planilla actualizada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Planilla no encontrada') {
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
   * DELETE /api/planillas/:id
   * Elimina una planilla
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deletePlanillaUseCase.execute(id);
      
      res.json({
        success: true,
        message: 'Planilla eliminada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Planilla no encontrada') {
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
   * POST /api/planillas/:id/confirmar-viaje
   * Confirma el inicio del viaje (borrador -> viaje)
   */
  async confirmarViaje(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kmSalida } = req.body;
      
      const planilla = await confirmarViajeUseCase.execute(id, kmSalida);
      
      res.json({
        success: true,
        data: planilla,
        message: 'Viaje confirmado exitosamente',
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
   * POST /api/planillas/:id/confirmar-llegada
   * Confirma la llegada (viaje -> control)
   */
  async confirmarLlegada(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kmLlegada } = req.body;
      
      const planilla = await confirmarLlegadaUseCase.execute(id, kmLlegada);
      
      res.json({
        success: true,
        data: planilla,
        message: 'Llegada confirmada exitosamente',
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
   * POST /api/planillas/:id/finalizar-control
   * Finaliza el control de una planilla (control -> completo/incompleto)
   */
  async finalizarControl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: FinalizarControlDto = req.body;
      
      const planilla = await finalizarControlUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: planilla,
        message: 'Control finalizado exitosamente',
      });
    } catch (error: any) {
      if (error.message.includes('no encontrada') || error.message.includes('debe estar') || error.message.includes('no coincide')) {
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
   * GET /api/planillas/tracking/:code
   * Consulta el tracking de un envío por código de seguimiento
   */
  async getTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      
      logger.debug('[Controller] getTracking: %o', { trackingCode: code });
      
      // Obtener información del remito
      const remito = await planillaRepository.getRemitoByTracking(code);
      
      if (!remito) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Código de seguimiento no encontrado',
        });
      }

      // Obtener todos los eventos de tracking
      const events = await planillaRepository.getTrackingByCode(code);

      // Determinar el estado actual basado en el último evento de tracking
      // ordenados por created_at ascendente
      const eventosOrdenados = [...events].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // El estado actual es el del último evento o el del remito si no hay eventos
      const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1];
      const estadoActual = ultimoEvento ? ultimoEvento.estado : remito.estado;

      res.json({
        success: true,
        data: {
          remito: {
            ...remito,
            estadoActual,
          },
          events,
        },
        message: 'Tracking encontrado',
      });
    } catch (error: any) {
      logger.error('[Controller] Error getTracking: %s', error.message);
      next(error);
    }
  }

  /**
   * GET /api/planillas/remitos/:estado
   * Obtener remitos por estado
   */
  async getRemitosByEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado } = req.params;
      const remitos = await planillaRepository.findRemitosByEstado(estado);
      
      res.json({
        success: true,
        data: remitos,
        message: 'Remitos encontrados',
      });
    } catch (error: any) {
      logger.error('[Controller] Error getRemitosByEstado: %s', error.message);
      next(error);
    }
  }
}

// Exportar instancia del controlador
export const planillaController = new PlanillaController();
