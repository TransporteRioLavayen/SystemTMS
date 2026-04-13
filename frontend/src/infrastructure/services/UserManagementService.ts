// =============================================================================
// USER MANAGEMENT SERVICE - INFRASTRUCTURE
// =============================================================================
// Servicio para gestionar usuarios desde el panel de administración

import apiClient from '../api/client';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'CHOFER';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  password?: string;    // Solo para usuarios creados desde el panel (source: 'admin')
  source?: string;      // 'clerk' = vino de Clerk, 'admin' = creado desde panel
}

export const userManagementService = {
  /**
   * Obtiene la lista de todos los usuarios del sistema
   */
  async listUsers(): Promise<UserInfo[]> {
    const response = await apiClient.get('/admin/users');
    return response.data.data;
  },

  /**
   * Crea un nuevo usuario
   */
  async createUser(userData: {
    email: string;
    name: string;
    role: UserRole;
  }): Promise<UserInfo> {
    const response = await apiClient.post('/admin/users', userData);
    return response.data.data;
  },

  /**
   * Actualiza el rol de un usuario
   */
  async updateUserRole(userId: string, role: UserRole): Promise<UserInfo> {
    const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
    return response.data.data;
  },

  /**
   * Desactiva un usuario (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },
};

export default userManagementService;