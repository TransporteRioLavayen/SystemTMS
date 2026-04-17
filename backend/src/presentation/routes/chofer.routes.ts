// =============================================================================
// ROUTES: CHOFER
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de choferes

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { choferController } from '../controllers/chofer.controller';

const router = Router();

// =============================================================================
// RUTAS PÚBLICAS
// =============================================================================
// GET /api/choferes - Listar todos (público para el ChoferView)
router.get('/', choferController.list.bind(choferController));

// =============================================================================
// RUTAS PROTEGIDAS
// =============================================================================
router.use(requireAuthJson());

router.get('/:id', choferController.getById.bind(choferController));
router.post('/', choferController.create.bind(choferController));
router.put('/:id', choferController.update.bind(choferController));
router.delete('/:id', choferController.delete.bind(choferController));

export default router;