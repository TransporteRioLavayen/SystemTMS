// =============================================================================
// ROUTES: UNIDAD
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de unidades

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { unidadController } from '../controllers/unidad.controller';

const router = Router();

router.use(requireAuthJson());

// Rutas para el módulo de unidades
router.get('/', unidadController.list.bind(unidadController));
router.get('/:id', unidadController.getById.bind(unidadController));
router.post('/', unidadController.create.bind(unidadController));
router.put('/:id', unidadController.update.bind(unidadController));
router.delete('/:id', unidadController.delete.bind(unidadController));

export default router;