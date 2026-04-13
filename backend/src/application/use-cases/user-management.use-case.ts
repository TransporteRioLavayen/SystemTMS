// =============================================================================
// USER MANAGEMENT USE CASE
// =============================================================================
// Application Layer - Casos de uso para gestión de usuarios
// =============================================================================

import { clerkClient } from '@clerk/express';
import { randomUUID } from 'crypto';
import { getSupabaseClient } from '../../infrastructure/database/supabase/client';
import { logger } from '../../infrastructure/logging/logger';
import type { UserInfo, UserRole } from '../../domain/entities/user-management.entity';

/**
 * Listar todos los usuarios desde public.users.
 */
export const listUsers = async (): Promise<UserInfo[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users_system')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[UserManagement] Error listando usuarios: %o', error);
    throw new Error(`Error al listar usuarios: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name || '',
    role: row.role as UserRole,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
    password: row.password || undefined,
    source: row.source || undefined,
  }));
};

/**
 * Actualizar el rol de un usuario.
 * Actualiza tanto public.users como Clerk publicMetadata.
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<UserInfo> => {
  const supabase = getSupabaseClient();

  // 1. Obtener datos del usuario para encontrar su clerk_id
  const { data: userData, error: userError } = await supabase
    .from('users_system')
    .select('email, clerk_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    logger.error('[UserManagement] Usuario no encontrado: %s', userId);
    throw new Error('Usuario no encontrado');
  }

  // 2. Actualizar en public.users
  const { data: updatedData, error: updateError } = await supabase
    .from('users_system')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    logger.error('[UserManagement] Error actualizando rol en public.users: %o', updateError);
    throw new Error(`Error al actualizar rol: ${updateError.message}`);
  }

  // 3. Actualizar Clerk publicMetadata si tenemos clerk_id
  if (userData.clerk_id) {
    try {
      await clerkClient.users.updateUserMetadata(userData.clerk_id, {
        publicMetadata: { role },
      });
      logger.info('[UserManagement] Rol actualizado en Clerk: userId=%s, role=%s', userData.clerk_id, role);
    } catch (clerkErr: any) {
      logger.warn('[UserManagement] Error actualizando Clerk metadata: %s', clerkErr.message);
      // No fallamos la operación si Clerk falla
    }
  }

  return {
    id: updatedData.id,
    email: updatedData.email,
    name: updatedData.name || '',
    role: updatedData.role as UserRole,
    avatarUrl: updatedData.avatar_url || undefined,
    bio: updatedData.bio || undefined,
    createdAt: updatedData.created_at,
    updatedAt: updatedData.updated_at || undefined,
  };
};

/**
 * Desactivar (eliminar) un usuario.
 * Elimina tanto de public.users como de Clerk.
 */
export const deactivateUser = async (userId: string): Promise<{ success: boolean }> => {
  const supabase = getSupabaseClient();

  // 1. Obtener datos del usuario para encontrar su clerk_id
  const { data: userData, error: userError } = await supabase
    .from('users_system')
    .select('email, clerk_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    logger.error('[UserManagement] Usuario no encontrado: %s', userId);
    throw new Error('Usuario no encontrado');
  }

  // 2. Eliminar de public.users
  const { error: deleteError } = await supabase
    .from('users_system')
    .delete()
    .eq('id', userId);

  if (deleteError) {
    logger.error('[UserManagement] Error eliminando usuario de public.users: %o', deleteError);
    throw new Error(`Error al eliminar usuario: ${deleteError.message}`);
  }

  // 3. Eliminar de Clerk si tenemos clerk_id
  if (userData.clerk_id) {
    try {
      await clerkClient.users.deleteUser(userData.clerk_id);
      logger.info('[UserManagement] Usuario eliminado de Clerk: %s', userData.clerk_id);
    } catch (clerkErr: any) {
      logger.warn('[UserManagement] Error eliminando usuario de Clerk: %s', clerkErr.message);
    }
  }

  return { success: true };
};

/**
 * Crear un nuevo usuario desde la UI de Admin.
 * Solo el ADMIN puede ejecutar esto.
 * @param parentId - ID del ADMIN que crea el usuario
 * @param userData - datos del nuevo usuario
 */
export const createUser = async (
  parentId: string,
  userData: {
    email: string;
    name: string;
    role: 'SUPERVISOR' | 'OPERADOR' | 'CHOFER';
  }
): Promise<UserInfo> => {
  const supabase = getSupabaseClient();

  // Generar password aleatorio
  const randomPassword = `user_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

  // Insertar en tabla users_system
  const { data, error } = await supabase
    .from('users_system')
    .insert({
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password: randomPassword,
      parent_id: parentId,
      avatar_url: null,
      bio: '',
      source: 'admin',
    })
    .select()
    .single();

  if (error) {
    logger.error('[UserManagement] Error creando usuario: %s', error.message);
    throw new Error(`Error al crear usuario: ${error.message}`);
  }

  logger.info('[UserManagement] Usuario creado: email=%s, role=%s, parent_id=%s', 
    userData.email, userData.role, parentId);

  return {
    id: data.id,
    email: data.email,
    name: data.name || '',
    role: data.role as UserRole,
    createdAt: data.created_at,
    password: data.password,  // Retornar password para mostrar en frontend
    source: data.source,      // Retornar source para saber si es editable
  };
};
