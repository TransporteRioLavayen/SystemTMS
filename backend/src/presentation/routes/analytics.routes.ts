// =============================================================================
// ROUTES: ANALYTICS
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de analíticas
// Todas las rutas están protegidas con Clerk auth y requieren rol ADMIN u OPERADOR

import { Router } from 'express';
import { requireAuthJson, authorizeRoles } from '../../infrastructure/middleware/clerk-auth';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

/**
 * Todas las rutas de analíticas requieren:
 * 1. Estar autenticado (requireAuthJson)
 * 2. Tener rol ADMIN u OPERADOR (authorizeRoles)
 */
router.use(requireAuthJson());
router.use(authorizeRoles('ADMIN', 'OPERADOR'));

// Endpoint para los KPIs principales del dashboard
router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));

// Endpoint para métricas detalladas de remitos
router.get('/remitos', analyticsController.getRemitos.bind(analyticsController));

// Endpoint para utilización y estado de la flota
router.get('/flota', analyticsController.getFlota.bind(analyticsController));

// Endpoint para obtener tendencias históricas
router.get('/tendencias', analyticsController.getTendencias.bind(analyticsController));

// Endpoint para alertas preventivas de mantenimiento
router.get('/alertas', analyticsController.getAlertas.bind(analyticsController));

export default router;
