// =============================================================================
// USER MANAGEMENT CONTROLLER
// =============================================================================
// Presentation Layer - Controller para gestión de usuarios
// =============================================================================

import { Request, Response } from 'express';
import { getSupabaseClient } from '../../infrastructure/database/supabase/client';
import { logger } from '../../infrastructure/logging/logger';
import * as userManagementUseCase from '../../application/use-cases/user-management.use-case';
import { getClerkUserId } from '../../infrastructure/middleware/clerk-auth';

class UserManagementController {
  /**
   * GET /users - Listar todos los usuarios
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userManagementUseCase.listUsers();
      res.json({
        success: true,
        data: users,
      });
    } catch (err: any) {
      logger.error('[UserManagementController] Error listando usuarios: %s', err.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al listar usuarios',
      });
    }
  }

  /**
   * POST /users - Crear un nuevo usuario desde la UI de Admin
   * NO usa Clerk - solo crea el usuario en la tabla users_system con password generado
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Obtener el ID de Clerk del usuario actual desde el token
      const clerkUserId = getClerkUserId(req);
      if (!clerkUserId) {
        res.status(401).json({ error: 'Unauthorized', message: 'No autenticado' });
        return;
      }

      const { email, name, role } = req.body;
      if (!email || !name || !role) {
        res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Faltan datos: email, name, role son requeridos' 
        });
        return;
      }

      // Buscar el usuario actual en users_system por clerk_id
      const supabase = getSupabaseClient();
      const { data: parentUser, error: parentError } = await supabase
        .from('users_system')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (parentError || !parentUser) {
        logger.error('[UserManagement] No se encontró el usuario admin: clerk_id=%s', clerkUserId);
        res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'Error al identificar usuario administrador' 
        });
        return;
      }

      // Crear el nuevo usuario (el use case genera la password automáticamente)
      const newUser = await userManagementUseCase.createUser(parentUser.id, { email, name, role });
      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (err: any) {
      logger.error('[UserManagementController] Error en createUser: %o', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Error al crear usuario',
      });
    }
  }

  /**
   * PATCH /users/:id/role - Actualizar rol de un usuario
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const updatedUser = await userManagementUseCase.updateUserRole(id, role);
      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (err: any) {
      logger.error('[UserManagementController] Error actualizando rol: %s', err.message);
      const statusCode = err.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: err.message,
      });
    }
  }

  /**
   * DELETE /users/:id - Desactivar un usuario
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await userManagementUseCase.deactivateUser(id);
      res.json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (err: any) {
      logger.error('[UserManagementController] Error eliminando usuario: %s', err.message);
      const statusCode = err.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: err.message,
      });
    }
  }
}

export const userManagementController = new UserManagementController();
