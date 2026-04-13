// =============================================================================
// ROUTES: CONSULTA
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de consultas

import { Router } from 'express';
import { requireAuthJson, authorizeRoles } from '../../infrastructure/middleware/clerk-auth';
import { validateBody } from '../../infrastructure/middleware/validation';
import { createConsultaSchema, updateConsultaSchema } from '../../infrastructure/middleware/schemas/consulta.schema';
import { consultaController } from '../controllers/consulta.controller';

const router = Router();

// Ruta pública - crear consulta desde landing page (sin auth)
router.post('/', validateBody(createConsultaSchema), consultaController.create.bind(consultaController));

// Rutas protegidas (requieren autenticación + rol ADMIN)
router.use(requireAuthJson());
router.use(authorizeRoles('ADMIN'));

router.get('/', consultaController.list.bind(consultaController));
router.patch('/:id', validateBody(updateConsultaSchema), consultaController.update.bind(consultaController));
router.delete('/:id', consultaController.delete.bind(consultaController));

export default router;
