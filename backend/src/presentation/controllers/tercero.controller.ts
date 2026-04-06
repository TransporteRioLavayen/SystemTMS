// =============================================================================
// CONTROLLER: TERCERO
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de terceros

import { Request, Response, NextFunction } from 'express';
import { ListTercerosUseCase } from '../../application/use-cases/list-terceros.use-case';
import { GetTerceroByIdUseCase } from '../../application/use-cases/get-tercero-by-id.use-case';
import { CreateTerceroUseCase } from '../../application/use-cases/create-tercero.use-case';
import { UpdateTerceroUseCase } from '../../application/use-cases/update-tercero.use-case';
import { DeleteTerceroUseCase } from '../../application/use-cases/delete-tercero.use-case';
import { terceroRepository } from '../../infrastructure/repositories/supabase-tercero.repository';
import { CreateTerceroDTO } from '../../application/dto/create-tercero.dto';
import { UpdateTerceroDTO } from '../../application/dto/update-tercero.dto';

// Instancias de use cases
const listTercerosUseCase = new ListTercerosUseCase(terceroRepository);
const getTerceroByIdUseCase = new GetTerceroByIdUseCase(terceroRepository);
const createTerceroUseCase = new CreateTerceroUseCase(terceroRepository);
const updateTerceroUseCase = new UpdateTerceroUseCase(terceroRepository);
const deleteTerceroUseCase = new DeleteTerceroUseCase(terceroRepository);

export class TerceroController {
  
  /**
   * GET /api/terceros
   * Lista todos los terceros (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.incluirInactivos === 'true';
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: terceros, total } = await listTercerosUseCase.executePaginated({ offset, limit, includeInactive });
      
      res.json({
        success: true,
        data: terceros,
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
   * GET /api/terceros/:id
   * Obtiene un tercero por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tercero = await getTerceroByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: tercero,
      });
    } catch (error: any) {
      if (error.message === 'Tercero no encontrado') {
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
   * POST /api/terceros
   * Crea un nuevo tercero
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateTerceroDTO = req.body;
      const nuevoTercero = await createTerceroUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevoTercero,
        message: 'Tercero creado exitosamente',
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
   * PUT /api/terceros/:id
   * Actualiza un tercero
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateTerceroDTO = req.body;
      
      const actualizado = await updateTerceroUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizado,
        message: 'Tercero actualizado exitosamente',
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
        });
      }
      if (error.message === 'Tercero no encontrado') {
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
   * DELETE /api/terceros/:id
   * Elimina un tercero (soft delete)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteTerceroUseCase.execute(id);
      
      res.json({
        success: true,
        message: 'Tercero eliminado exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Tercero no encontrado') {
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
export const terceroController = new TerceroController();