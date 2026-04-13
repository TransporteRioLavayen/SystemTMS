// =============================================================================
// CONTROLLER: CONSULTA
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de consultas

import { Request, Response, NextFunction } from 'express';
import { CreateConsultaUseCase } from '../../application/use-cases/create-consulta.use-case';
import { ListConsultasUseCase } from '../../application/use-cases/list-consultas.use-case';
import { UpdateConsultaUseCase } from '../../application/use-cases/update-consulta.use-case';
import { DeleteConsultaUseCase } from '../../application/use-cases/delete-consulta.use-case';
import { consultaRepository } from '../../infrastructure/repositories/supabase-consulta.repository';
import { CreateConsultaDTO } from '../../application/dto/create-consulta.dto';
import { UpdateConsultaDTO } from '../../application/dto/update-consulta.dto';

// Instancias de use cases (inyección de dependencias simple)
const createConsultaUseCase = new CreateConsultaUseCase(consultaRepository);
const listConsultasUseCase = new ListConsultasUseCase(consultaRepository);
const updateConsultaUseCase = new UpdateConsultaUseCase(consultaRepository);
const deleteConsultaUseCase = new DeleteConsultaUseCase(consultaRepository);

export class ConsultaController {

  /**
   * POST /api/consultas
   * Crea una nueva consulta (público desde landing page)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateConsultaDTO;
      const nuevaConsulta = await createConsultaUseCase.execute({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        tipoConsulta: data.tipoConsulta,
        mensaje: data.mensaje,
      });

      res.status(201).json({
        success: true,
        data: nuevaConsulta,
        message: 'Consulta enviada exitosamente',
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
   * GET /api/consultas
   * Lista todas las consultas (con paginación) - Solo ADMIN
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const offset = (page - 1) * limit;
      const estado = req.query.estado as string;

      const { data: consultas, total } = await listConsultasUseCase.execute({ offset, limit, estado });

      res.json({
        success: true,
        data: consultas,
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
   * PATCH /api/consultas/:id
   * Actualiza una consulta (estado/respuesta) - Solo ADMIN
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateConsultaDTO = req.body;

      const actualizada = await updateConsultaUseCase.execute(id, data);

      res.json({
        success: true,
        data: actualizada,
        message: 'Consulta actualizada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Consulta no encontrada') {
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
   * DELETE /api/consultas/:id
   * Elimina una consulta - Solo ADMIN
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteConsultaUseCase.execute(id);

      res.json({
        success: true,
        message: 'Consulta eliminada exitosamente',
      });
    } catch (error: any) {
      if (error.message === 'Consulta no encontrada') {
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
export const consultaController = new ConsultaController();
