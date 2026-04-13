// =============================================================================
// ROUTES: COTIZACION
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de cotizaciones

import { Router } from 'express';
import { requireAuthJson, authorizeRoles } from '../../infrastructure/middleware/clerk-auth';
import { cotizacionController } from '../controllers/cotizacion.controller';

const router = Router();

// Ruta pública - crear cotización desde landing page (sin auth)
// El frontend envía los datos y se guarda automáticamente antes de abrir WhatsApp
router.post('/', cotizacionController.create.bind(cotizacionController));

// Rutas protegidas (requieren autenticación + rol ADMIN)
router.use(requireAuthJson());
router.use(authorizeRoles('ADMIN'));

router.get('/', cotizacionController.list.bind(cotizacionController));
router.delete('/:id', cotizacionController.delete.bind(cotizacionController));

export default router;