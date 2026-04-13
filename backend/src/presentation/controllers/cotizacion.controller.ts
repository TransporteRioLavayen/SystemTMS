// =============================================================================
// CONTROLLER: COTIZACION
// =============================================================================
// Presentation Layer - Controlador para gestionar cotizaciones desde la landing page

import { Request, Response } from 'express';
import { CreateCotizacionDto, CreateCotizacionSchema } from '../../application/dto/create-cotizacion.dto';
import { cotizacionRepository } from '../../infrastructure/repositories/supabase-cotizacion.repository';

export class CotizacionController {

  async create(req: Request, res: Response) {
    try {
      // Validar datos de entrada
      const parsed = CreateCotizacionSchema.parse(req.body);
      
      // Forzar tipo requerido para TypeScript
      const validatedData = parsed as Required<typeof parsed>;

      // Crear cotización en la base de datos
      const cotizacion = await cotizacionRepository.create(validatedData);

      // Responder con éxito
      return res.status(201).json({
        success: true,
        message: 'Cotización guardada correctamente',
        data: cotizacion,
      });
    } catch (error: any) {
      console.error('Error creando cotización:', error);
      
      // Error de validación de Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Datos de cotización inválidos',
          errors: error.errors,
        });
      }

      // Error de base de datos u otro
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al guardar la cotización',
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const { data, total } = await cotizacionRepository.findAllPaginated({ offset, limit });

      return res.json({
        success: true,
        data,
        pagination: {
          offset,
          limit,
          total,
        },
      });
    } catch (error: any) {
      console.error('Error listando cotizaciones:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al listar las cotizaciones',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la cotización es requerido',
        });
      }

      await cotizacionRepository.delete(id);

      return res.json({
        success: true,
        message: 'Cotización eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error eliminando cotización:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la cotización',
      });
    }
  }
}

// Exportar instancia singleton
export const cotizacionController = new CotizacionController();