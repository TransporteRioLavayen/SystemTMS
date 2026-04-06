// =============================================================================
// ROUTES: CHOFER
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de choferes

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { choferController } from '../controllers/chofer.controller';

const router = Router();

router.use(requireAuthJson());

// Rutas para el módulo de choferes
router.get('/', choferController.list.bind(choferController));
router.get('/:id', choferController.getById.bind(choferController));
router.post('/', choferController.create.bind(choferController));
router.put('/:id', choferController.update.bind(choferController));
router.delete('/:id', choferController.delete.bind(choferController));

export default router;