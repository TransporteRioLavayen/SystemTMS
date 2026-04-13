// =============================================================================
// CONTROLLER: Calculator Factor Controller (Pricing)
// =============================================================================
// Presentation Layer
// Maneja las requests HTTP para gestión de factores de cálculo

import { Request, Response } from 'express';
import { calculatorFactorRepository } from '../../infrastructure/repositories/calculator-factor.repository';
import { createCalculatorFactorEntity, updateCalculatorFactorEntity } from '../../domain/entities/calculator-factor.entity';
import { logger } from '../../infrastructure/logging/logger';

class CalculatorFactorController {
  // GET /api/admin/calculator-factors
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.query;

      const filters: any = {};
      if (estado) filters.estado = estado;

      const factors = await calculatorFactorRepository.findAll(filters);
      logger.info({ count: factors.length }, 'Calculator factors retrieved');
      res.status(200).json({ factors });
    } catch (error) {
      logger.error({ error }, 'Error getting calculator factors');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/calculator-factors/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const factor = await calculatorFactorRepository.findById(id);

      if (!factor) {
        res.status(404).json({ error: 'Calculator factor not found' });
        return;
      }

      logger.info({ factorId: id }, 'Calculator factor retrieved');
      res.status(200).json(factor);
    } catch (error) {
      logger.error({ error }, 'Error getting calculator factor');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/calculator-factors
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, valor, tipo, descripcion } = req.body;

      // Validar que no exista otro factor con el mismo nombre
      const existing = await calculatorFactorRepository.findByNombre(nombre);
      if (existing) {
        res.status(400).json({ error: `Calculator factor with name "${nombre}" already exists` });
        return;
      }

      // Crear el factor
      const factor = createCalculatorFactorEntity({
        id: crypto.randomUUID ? crypto.randomUUID() : `factor-${Date.now()}`,
        nombre,
        valor,
        tipo,
        descripcion,
      });

      const created = await calculatorFactorRepository.create(factor);
      logger.info({ factorId: created.id, nombre }, 'Calculator factor created');
      res.status(201).json(created);
    } catch (error) {
      logger.error({ error }, 'Error creating calculator factor');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/calculator-factors/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await calculatorFactorRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Calculator factor not found' });
        return;
      }

      // Si se intenta cambiar el nombre, validar que no exista otro con ese nombre
      if (req.body.nombre && req.body.nombre !== existing.nombre) {
        const duplicate = await calculatorFactorRepository.findByNombre(req.body.nombre);
        if (duplicate) {
          res.status(400).json({ error: `Calculator factor with name "${req.body.nombre}" already exists` });
          return;
        }
      }

      const updated = updateCalculatorFactorEntity(existing, req.body);
      const result = await calculatorFactorRepository.update(id, req.body);

      logger.info({ factorId: id }, 'Calculator factor updated');
      res.status(200).json(result);
    } catch (error) {
      logger.error({ error }, 'Error updating calculator factor');
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/calculator-factors/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await calculatorFactorRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Calculator factor not found' });
        return;
      }

      await calculatorFactorRepository.deactivate(id);
      logger.info({ factorId: id }, 'Calculator factor deactivated');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Error deleting calculator factor');
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const calculatorFactorController = new CalculatorFactorController();
