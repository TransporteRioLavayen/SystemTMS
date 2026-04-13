// =============================================================================
// USER MANAGEMENT ENTITY
// =============================================================================
// Domain Layer - Interfaces y tipos para gestión de usuarios
// =============================================================================

/**
 * Roles disponibles en el sistema.
 * Coincide con la tabla public.users en Supabase.
 */
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'CHOFER';

/**
 * Información completa de un usuario.
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
  password?: string;      // Solo para usuarios creados desde el panel (source: 'admin')
  source?: string;       // 'clerk' = vino de Clerk, 'admin' = creado desde panel
}

/**
 * Request para actualizar el rol de un usuario.
 */
export interface UpdateRoleRequest {
  role: UserRole;
}
