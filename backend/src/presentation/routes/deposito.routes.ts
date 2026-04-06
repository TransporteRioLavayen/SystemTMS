// =============================================================================
// ROUTES: DEPOSITO
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de depósitos

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { depositoController } from '../controllers/deposito.controller';

const router = Router();

router.use(requireAuthJson());

// Rutas para el módulo de depósitos
router.get('/', depositoController.list.bind(depositoController));
router.get('/:id', depositoController.getById.bind(depositoController));
router.post('/', depositoController.create.bind(depositoController));
router.put('/:id', depositoController.update.bind(depositoController));
router.delete('/:id', depositoController.delete.bind(depositoController));

export default router;