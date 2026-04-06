// =============================================================================
// CONTROLLER: DEPOSITO
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de depósitos

import { Request, Response, NextFunction } from 'express';
import { ListDepositosUseCase } from '../../application/use-cases/list-depositos.use-case';
import { GetDepositoByIdUseCase } from '../../application/use-cases/get-deposito-by-id.use-case';
import { CreateDepositoUseCase } from '../../application/use-cases/create-deposito.use-case';
import { UpdateDepositoUseCase } from '../../application/use-cases/update-deposito.use-case';
import { DeleteDepositoUseCase } from '../../application/use-cases/delete-deposito.use-case';
import { depositoRepository } from '../../infrastructure/repositories/supabase-deposito.repository';
import { CreateDepositoDTO } from '../../application/dto/create-deposito.dto';
import { UpdateDepositoDTO } from '../../application/dto/update-deposito.dto';

// Instancias de use cases (inyección de dependencias simple)
const listDepositosUseCase = new ListDepositosUseCase(depositoRepository);
const getDepositoByIdUseCase = new GetDepositoByIdUseCase(depositoRepository);
const createDepositoUseCase = new CreateDepositoUseCase(depositoRepository);
const updateDepositoUseCase = new UpdateDepositoUseCase(depositoRepository);
const deleteDepositoUseCase = new DeleteDepositoUseCase(depositoRepository);

export class DepositoController {
  
  /**
   * GET /api/depositos
   * Lista todos los depósitos (con paginación opcional)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.incluirInactivos === 'true';
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      
      const { data: depositos, total } = await listDepositosUseCase.executePaginated({ offset, limit, includeInactive });
      
      res.json({
        success: true,
        data: depositos,
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
   * GET /api/depositos/:id
   * Obtiene un depósito por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deposito = await getDepositoByIdUseCase.execute(id);
      
      res.json({
        success: true,
        data: deposito,
      });
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
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
   * POST /api/depositos
   * Crea un nuevo depósito
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateDepositoDTO = req.body;
      const nuevoDeposito = await createDepositoUseCase.execute(data);
      
      res.status(201).json({
        success: true,
        data: nuevoDeposito,
        message: 'Depósito creado exitosamente',
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
   * PUT /api/depositos/:id
   * Actualiza un depósito
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateDepositoDTO = req.body;
      
      const actualizado = await updateDepositoUseCase.execute(id, data);
      
      res.json({
        success: true,
        data: actualizado,
        message: 'Depósito actualizado exitosamente',
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
        });
      }
      if (error.message?.includes('no encontrado')) {
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
   * DELETE /api/depositos/:id
   * Elimina (soft delete) un depósito
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteDepositoUseCase.execute(id);
      
      res.json({
        success: true,
        message: 'Depósito eliminado exitosamente',
      });
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
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
export const depositoController = new DepositoController();
