// =============================================================================
// ROUTES: ADMIN
// =============================================================================
// Presentation Layer - Rutas de administración
// =============================================================================

import { Router, Request, Response } from 'express';
import { requireAuthJson, authorizeRoles } from '../../infrastructure/middleware/clerk-auth';
import { validateBody } from '../../infrastructure/middleware/validation';
import { userManagementController } from '../controllers/user-management.controller';
import type { UserRole } from '../../domain/entities/user-management.entity';
import { createUserSchema, updateRoleSchema } from '../../infrastructure/middleware/schemas/admin.schema';

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

export default router;