// =============================================================================
// CONTROLLER: Formula Calculo Controller
// =============================================================================
// Presentation Layer
// Maneja las requests HTTP para gestión de fórmulas de cálculo

import { Request, Response } from 'express';
import { formulaCalculoRepository } from '../../infrastructure/repositories/formula-calculo.repository';
import { createFormulaCalculoEntity, updateFormulaCalculoEntity } from '../../domain/entities/formula-calculo.entity';
import { logger } from '../../infrastructure/logging/logger';

class FormulaCalculoController {
  // GET /api/admin/formulas-calculo
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.query;

      const filters: any = {};
      if (estado) filters.estado = estado;

      const formulas = await formulaCalculoRepository.findAll(filters);
      logger.info({ count: formulas.length }, 'Formula calculations retrieved');
      res.status(200).json({ formulas });
    } catch (error) {
      logger.error({ error }, 'Error getting formula calculations');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/formulas-calculo/ordered
  async getAllOrdered(req: Request, res: Response): Promise<void> {
    try {
      const formulas = await formulaCalculoRepository.findAllOrderByOrden();
      logger.info({ count: formulas.length }, 'Formula calculations ordered retrieved');
      res.status(200).json({ formulas });
    } catch (error) {
      logger.error({ error }, 'Error getting formula calculations ordered');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/formulas-calculo/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const formula = await formulaCalculoRepository.findById(id);

      if (!formula) {
        res.status(404).json({ error: 'Formula calculation not found' });
        return;
      }

      logger.info({ formulaId: id }, 'Formula calculation retrieved');
      res.status(200).json(formula);
    } catch (error) {
      logger.error({ error }, 'Error getting formula calculation');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/formulas-calculo
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, codigo, descripcion, formula, parametros, ordenEjecucion } = req.body;

      // Validar que no exista otra fórmula con el mismo código
      const existing = await formulaCalculoRepository.findByCodigo(codigo);
      if (existing) {
        res.status(400).json({ error: `Formula calculation with code "${codigo}" already exists` });
        return;
      }

      // Crear la fórmula
      const formulaEntity = createFormulaCalculoEntity({
        id: crypto.randomUUID ? crypto.randomUUID() : `formula-${Date.now()}`,
        nombre,
        codigo,
        descripcion,
        formula,
        parametros: parametros || [],
        ordenEjecucion,
      });

      const created = await formulaCalculoRepository.create(formulaEntity);
      logger.info({ formulaId: created.id, codigo }, 'Formula calculation created');
      res.status(201).json(created);
    } catch (error) {
      logger.error({ error }, 'Error creating formula calculation');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/formulas-calculo/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await formulaCalculoRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Formula calculation not found' });
        return;
      }

      // Si se intenta cambiar el código, validar que no exista otro con ese código
      if (req.body.codigo && req.body.codigo !== existing.codigo) {
        const duplicate = await formulaCalculoRepository.findByCodigo(req.body.codigo);
        if (duplicate) {
          res.status(400).json({ error: `Formula calculation with code "${req.body.codigo}" already exists` });
          return;
        }
      }

      const updated = updateFormulaCalculoEntity(existing, req.body);
      const result = await formulaCalculoRepository.update(id, req.body);

      logger.info({ formulaId: id }, 'Formula calculation updated');
      res.status(200).json(result);
    } catch (error) {
      logger.error({ error }, 'Error updating formula calculation');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/formulas-calculo/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await formulaCalculoRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Formula calculation not found' });
        return;
      }

      await formulaCalculoRepository.deactivate(id);
      logger.info({ formulaId: id }, 'Formula calculation deactivated');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Error deleting formula calculation');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const formulaCalculoController = new FormulaCalculoController();