// =============================================================================
// ROUTES: TERCERO
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de terceros

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { terceroController } from '../controllers/tercero.controller';

const router = Router();

router.use(requireAuthJson());

// Rutas para el módulo de terceros
router.get('/', terceroController.list.bind(terceroController));
router.get('/:id', terceroController.getById.bind(terceroController));
router.post('/', terceroController.create.bind(terceroController));
router.put('/:id', terceroController.update.bind(terceroController));
router.delete('/:id', terceroController.delete.bind(terceroController));

export default router;