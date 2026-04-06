// =============================================================================
// CONTROLLER: UNIDAD
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de unidades

import { Request, Response, NextFunction } from 'express';
import { ListUnidadesUseCase } from '../../application/use-cases/list-unidades.use-case';
import { GetUnidadByIdUseCase } from '../../application/use-cases/get-unidad-by-id.use-case';
import { CreateUnidadUseCase, ValidationError as CreateValidationError } from '../../application/use-cases/create-unidad.use-case';
import { UpdateUnidadUseCase, ValidationError as UpdateValidationError } from '../../application/use-cases/update-unidad.use-case';
import { DeleteUnidadUseCase } from '../../application/use-cases/delete-unidad.use-case';
import { unidadRepository } from '../../infrastructure/repositories/supabase-unidad.repository';
import { CreateUnidadDTO } from '../../application/dto/create-unidad.dto';
import { UpdateUnidadDTO } from '../../application/dto/update-unidad.dto';

// Instancias de use cases (inyección de dependencias simple)
const listUnidadesUseCase = new ListUnidadesUseCase(unidadRepository);
const getUnidadByIdUseCase = new GetUnidadByIdUseCase(unidadRepository);
const createUnidadUseCase = new CreateUnidadUseCase(unidadRepository);
const updateUnidadUseCase = new UpdateUnidadUseCase(unidadRepository);
const deleteUnidadUseCase = new DeleteUnidadUseCase(unidadRepository);

export class UnidadController {
  
  /**
   * GET /api/unidades
   * Lista todas las unidades (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.incluirInactivos === 'true';
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: unidades, total } = await listUnidadesUseCase.executePaginated({ offset, limit, includeInactive });
      
      res.json({
        success: true,
        data: unidades,
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
   * GET /api/unidades/:id
   * Obtiene una unidad por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const unidad = await getUnidadByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: unidad,
      });
    } catch (error: any) {
      if (error.message === 'Unidad no encontrada') {
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
   * POST /api/unidades
   * Crea una nueva unidad
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUnidadDTO = req.body;
      const nuevaUnidad = await createUnidadUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevaUnidad,
        message: 'Unidad creada exitosamente',
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
   * PUT /api/unidades/:id
   * Actualiza una unidad
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateUnidadDTO = req.body;
      
      const actualizada = await updateUnidadUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizada,
        message: 'Unidad actualizada exitosamente',
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
        });
      }
      if (error.message === 'Unidad no encontrada') {
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
   * DELETE /api/unidades/:id
   * Elimina una unidad
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteUnidadUseCase.execute(id);
      
      res.json({
        success: true,
        message: 'Unidad eliminada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Unidad no encontrada') {
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
export const unidadController = new UnidadController();