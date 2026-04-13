// =============================================================================
// ROUTES: ADMIN
// =============================================================================
// Presentation Layer - Rutas de administración
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuthJson, authorizeRoles } from '../../infrastructure/middleware/clerk-auth';
import { validateBody } from '../../infrastructure/middleware/validation';
import { userManagementController } from '../controllers/user-management.controller';
import { zoneController } from '../controllers/zone.controller';
import { localityController } from '../controllers/locality.controller';
import { calculatorFactorController } from '../controllers/pricing.controller';
import { tariffRateController } from '../controllers/tariff-rate.controller';
import { formulaCalculoController } from '../controllers/formula-calculo.controller';
import type { UserRole } from '../../domain/entities/user-management.entity';
import { createUserSchema, updateRoleSchema } from '../../infrastructure/middleware/schemas/admin.schema';
import {
  CreateZoneSchema,
  UpdateZoneSchema,
  CreateLocalitySchema,
  UpdateLocalitySchema,
  CreateTariffRateSchema,
  UpdateTariffRateSchema,
  CreateCalculatorFactorSchema,
  UpdateCalculatorFactorSchema,
} from '../../infrastructure/middleware/schemas/pricing.schema';

const router = Router();

// =============================================================================
// RUTAS PROTEGIDAS - Solo ADMIN
// =============================================================================

// Middleware: requiere auth + rol ADMIN
const requireAdmin = [requireAuthJson(), authorizeRoles('ADMIN' as UserRole)];

// ============= USER MANAGEMENT =============

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  await userManagementController.listUsers(req, res);
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/users', requireAdmin, validateBody(createUserSchema), async (req: Request, res: Response) => {
  await userManagementController.createUser(req, res);
});

// PATCH /api/admin/users/:id/role - Actualizar rol de usuario
router.patch('/users/:id/role', requireAdmin, validateBody(updateRoleSchema), async (req: Request, res: Response) => {
  await userManagementController.updateUserRole(req, res);
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  await userManagementController.deactivateUser(req, res);
});

// ============= ZONES =============

// GET /api/admin/zones - Listar todas las zonas
router.get('/zones', requireAdmin, async (req: Request, res: Response) => {
  await zoneController.getAll(req, res);
});

// GET /api/admin/zones/:id - Obtener una zona por ID
router.get('/zones/:id', requireAdmin, async (req: Request, res: Response) => {
  await zoneController.getById(req, res);
});

// POST /api/admin/zones - Crear una nueva zona
router.post('/zones', requireAdmin, validateBody(CreateZoneSchema), async (req: Request, res: Response) => {
  await zoneController.create(req, res);
});

// PUT /api/admin/zones/:id - Actualizar una zona
router.put('/zones/:id', requireAdmin, validateBody(UpdateZoneSchema), async (req: Request, res: Response) => {
  await zoneController.update(req, res);
});

// DELETE /api/admin/zones/:id - Eliminar una zona
router.delete('/zones/:id', requireAdmin, async (req: Request, res: Response) => {
  await zoneController.delete(req, res);
});

// ============= LOCALITIES =============

// GET /api/admin/localities - Listar todas las localidades
router.get('/localities', requireAdmin, async (req: Request, res: Response) => {
  await localityController.getAll(req, res);
});

// GET /api/admin/localities/:id - Obtener una localidad por ID
router.get('/localities/:id', requireAdmin, async (req: Request, res: Response) => {
  await localityController.getById(req, res);
});

// GET /api/admin/zones/:zoneId/localities - Obtener localidades por zona
router.get('/zones/:zoneId/localities', requireAdmin, async (req: Request, res: Response) => {
  await localityController.getByZoneId(req, res);
});

// POST /api/admin/localities - Crear una nueva localidad
router.post('/localities', requireAdmin, validateBody(CreateLocalitySchema), async (req: Request, res: Response) => {
  await localityController.create(req, res);
});

// PUT /api/admin/localities/:id - Actualizar una localidad
router.put('/localities/:id', requireAdmin, validateBody(UpdateLocalitySchema), async (req: Request, res: Response) => {
  await localityController.update(req, res);
});

// DELETE /api/admin/localities/:id - Eliminar una localidad
router.delete('/localities/:id', requireAdmin, async (req: Request, res: Response) => {
  await localityController.delete(req, res);
});

// ============= TARIFF RATES =============

// GET /api/admin/tariff-rates - Listar todas las tarifas
router.get('/tariff-rates', requireAdmin, async (req: Request, res: Response) => {
  await tariffRateController.getAll(req, res);
});

// GET /api/admin/tariff-rates/:id - Obtener una tarifa por ID
router.get('/tariff-rates/:id', requireAdmin, async (req: Request, res: Response) => {
  await tariffRateController.getById(req, res);
});

// GET /api/admin/tariff-rates/versions/:cargoType/:zone - Obtener versiones de tarifa
// NOTA: Esta ruta debe estar ANTES que las rutas parametrizadas
router.get('/tariff-rates/versions/:cargoType/:zone', requireAdmin, async (req: Request, res: Response) => {
  await tariffRateController.getVersions(req, res);
});

// POST /api/admin/tariff-rates - Crear una nueva tarifa
router.post('/tariff-rates', requireAdmin, validateBody(CreateTariffRateSchema), async (req: Request, res: Response) => {
  await tariffRateController.create(req, res);
});

// PUT /api/admin/tariff-rates/:id - Actualizar una tarifa (crea nueva versión)
router.put('/tariff-rates/:id', requireAdmin, validateBody(UpdateTariffRateSchema), async (req: Request, res: Response) => {
  await tariffRateController.update(req, res);
});

// DELETE /api/admin/tariff-rates/:id - Eliminar una tarifa
router.delete('/tariff-rates/:id', requireAdmin, async (req: Request, res: Response) => {
  await tariffRateController.delete(req, res);
});

// ============= CALCULATOR FACTORS =============

// GET /api/admin/calculator-factors - Listar todos los factores
router.get('/calculator-factors', requireAdmin, async (req: Request, res: Response) => {
  await calculatorFactorController.getAll(req, res);
});

// GET /api/admin/calculator-factors/:id - Obtener un factor por ID
router.get('/calculator-factors/:id', requireAdmin, async (req: Request, res: Response) => {
  await calculatorFactorController.getById(req, res);
});

// POST /api/admin/calculator-factors - Crear un nuevo factor
router.post('/calculator-factors', requireAdmin, validateBody(CreateCalculatorFactorSchema), async (req: Request, res: Response) => {
  await calculatorFactorController.create(req, res);
});

// PUT /api/admin/calculator-factors/:id - Actualizar un factor
router.put('/calculator-factors/:id', requireAdmin, validateBody(UpdateCalculatorFactorSchema), async (req: Request, res: Response) => {
  await calculatorFactorController.update(req, res);
});

// DELETE /api/admin/calculator-factors/:id - Deactivar un factor
router.delete('/calculator-factors/:id', requireAdmin, async (req: Request, res: Response) => {
  await calculatorFactorController.delete(req, res);
});

// ============= FORMULAS DE CÁLCULO =============

// GET /api/admin/formulas-calculo - Listar todas las fórmulas
router.get('/formulas-calculo', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.getAll(req, res);
});

// GET /api/admin/formulas-calculo/ordered - Listar todas las fórmulas ordenadas por ejecución
router.get('/formulas-calculo/ordered', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.getAllOrdered(req, res);
});

// GET /api/admin/formulas-calculo/:id - Obtener una fórmula por ID
router.get('/formulas-calculo/:id', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.getById(req, res);
});

// POST /api/admin/formulas-calculo - Crear una nueva fórmula
router.post('/formulas-calculo', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.create(req, res);
});

// PUT /api/admin/formulas-calculo/:id - Actualizar una fórmula
router.put('/formulas-calculo/:id', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.update(req, res);
});

// DELETE /api/admin/formulas-calculo/:id - Deactivar una fórmula
router.delete('/formulas-calculo/:id', requireAdmin, async (req: Request, res: Response) => {
  await formulaCalculoController.delete(req, res);
});

export default router;
