// =============================================================================
// ROUTES: PLANILLA
// =============================================================================
// Presentation Layer - Rutas HTTP para el módulo de planillas

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { planillaController } from '../controllers/planilla.controller';
import { validateBody } from '../../infrastructure/middleware/validation';
import {
  createPlanillaSchema,
  updatePlanillaSchema,
  confirmarViajeSchema,
  confirmarLlegadaSchema,
  finalizarControlSchema,
} from '../../infrastructure/middleware/schemas/planilla.schema';

const router = Router();

router.use(requireAuthJson());

// =============================================================================
// RUTAS PLANILLAS
// =============================================================================

// GET /api/planillas - Listar todas las planillas
router.get('/', planillaController.list.bind(planillaController));

// GET /api/planillas/remitos/:estado - Obtener remitos por estado (ANTES de /:id)
router.get('/remitos/:estado', planillaController.getRemitosByEstado.bind(planillaController));

// GET /api/planillas/:id - Obtener una planilla por ID
router.get('/:id', planillaController.getById.bind(planillaController));

// POST /api/planillas - Crear una nueva planilla (con validación)
router.post('/', validateBody(createPlanillaSchema), planillaController.create.bind(planillaController));

// PUT /api/planillas/:id - Actualizar una planilla (con validación)
router.put('/:id', validateBody(updatePlanillaSchema), planillaController.update.bind(planillaController));

// DELETE /api/planillas/:id - Eliminar una planilla
router.delete('/:id', planillaController.delete.bind(planillaController));

// POST /api/planillas/:id/confirmar-viaje - Confirmar inicio del viaje (con validación)
router.post('/:id/confirmar-viaje', validateBody(confirmarViajeSchema), planillaController.confirmarViaje.bind(planillaController));

// POST /api/planillas/:id/confirmar-llegada - Confirmar llegada (con validación)
router.post('/:id/confirmar-llegada', validateBody(confirmarLlegadaSchema), planillaController.confirmarLlegada.bind(planillaController));

// POST /api/planillas/:id/finalizar-control - Finalizar control de bultos (con validación)
router.post('/:id/finalizar-control', validateBody(finalizarControlSchema), planillaController.finalizarControl.bind(planillaController));

// GET /api/tracking/:code - Consultar tracking por código
router.get('/tracking/:code', planillaController.getTracking.bind(planillaController));

export default router;
