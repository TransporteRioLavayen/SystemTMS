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

// =============================================================================
// DASHBOARD PRINCIPAL
// =============================================================================

// Endpoint para los KPIs principales del dashboard
router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));

// Resumen ejecutivo (para KPI cards)
router.get('/resumen', analyticsController.getResumen.bind(analyticsController));

// =============================================================================
// MÓDULOS ESPECÍFICOS
// =============================================================================

// Remitos
router.get('/remitos', analyticsController.getRemitos.bind(analyticsController));

// Flota (unidades propias)
router.get('/flota', analyticsController.getFlota.bind(analyticsController));

// Hojas de ruta
router.get('/hojas-ruta', analyticsController.getHojasRuta.bind(analyticsController));

// Choferes
router.get('/choferes', analyticsController.getChoferes.bind(analyticsController));

// Terceros (flota externa)
router.get('/terceros', analyticsController.getTerceros.bind(analyticsController));

// Depósitos
router.get('/depositos', analyticsController.getDepositos.bind(analyticsController));

// Consultas
router.get('/consultas', analyticsController.getConsultas.bind(analyticsController));

// Cotizaciones
router.get('/cotizaciones', analyticsController.getCotizaciones.bind(analyticsController));

// Planillas
router.get('/planillas', analyticsController.getPlanillas.bind(analyticsController));

// =============================================================================
// TENDENCIAS Y ALERTAS
// =============================================================================

// Tendencias históricas
router.get('/tendencias', analyticsController.getTendencias.bind(analyticsController));

// Alertas de mantenimiento y vencimientos
router.get('/alertas', analyticsController.getAlertas.bind(analyticsController));

export default router;