// =============================================================================
// CONTROLLER: CHOFER
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de choferes

import { Request, Response, NextFunction } from 'express';
import { ListChoferesUseCase } from '../../application/use-cases/list-choferes.use-case';
import { GetChoferByIdUseCase } from '../../application/use-cases/get-chofer-by-id.use-case';
import { CreateChoferUseCase } from '../../application/use-cases/create-chofer.use-case';
import { UpdateChoferUseCase } from '../../application/use-cases/update-chofer.use-case';
import { DeleteChoferUseCase } from '../../application/use-cases/delete-chofer.use-case';
import { choferRepository } from '../../infrastructure/repositories/supabase-chofer.repository';
import { CreateChoferDTO } from '../../application/dto/create-chofer.dto';
import { UpdateChoferDTO } from '../../application/dto/update-chofer.dto';

// Instancias de use cases (inyección de dependencias simple)
const listChoferesUseCase = new ListChoferesUseCase(choferRepository);
const getChoferByIdUseCase = new GetChoferByIdUseCase(choferRepository);
const createChoferUseCase = new CreateChoferUseCase(choferRepository);
const updateChoferUseCase = new UpdateChoferUseCase(choferRepository);
const deleteChoferUseCase = new DeleteChoferUseCase(choferRepository);

export class ChoferController {
  
  /**
   * GET /api/choferes
   * Lista todos los choferes (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.incluirInactivos === 'true';
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: choferes, total } = await listChoferesUseCase.executePaginated({ offset, limit, includeInactive });
      
      res.json({
        success: true,
        data: choferes,
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
   * GET /api/choferes/:id
   * Obtiene un chofer por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const chofer = await getChoferByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: chofer,
      });
    } catch (error: any) {
      if (error.message === 'Chofer no encontrado') {
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
   * POST /api/choferes
   * Crea un nuevo chofer
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateChoferDTO = req.body;
      const nuevoChofer = await createChoferUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevoChofer,
        message: 'Chofer creado exitosamente',
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/choferes/:id
   * Actualiza un chofer
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateChoferDTO = req.body;
      
      const actualizado = await updateChoferUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizado,
        message: 'Chofer actualizado exitosamente',
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
        });
      }
      if (error.message === 'Chofer no encontrado') {
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
   * DELETE /api/choferes/:id
   * Elimina un chofer
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteChoferUseCase.execute(id);
      
      res.json({
        success: true,
        message: 'Chofer eliminado exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Chofer no encontrado') {
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
export const choferController = new ChoferController();