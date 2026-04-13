// =============================================================================
// ROUTES: AUTH
// =============================================================================
// Presentation Layer - Endpoints de autenticación con Clerk
//
// Clerk maneja el login/register en el frontend.
// Estos endpoints sincronizan el usuario con Supabase Auth y validan la sesión.

import { Router, Request, Response } from 'express';
import { clerkClient } from '@clerk/express';
import { verifyToken } from '@clerk/backend';
import { getSupabaseClient } from '../../infrastructure/database/supabase/client';
import { logger } from '../../infrastructure/logging/logger';

const router = Router();

// =============================================================================
// HELPER — Extraer userId del token de Clerk
// =============================================================================
async function extractUserId(req: Request): Promise<string | null> {
  // 1. Primero: verificar token del header Authorization con verifyToken (MÁS CONFIABLE)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      logger.info('[Auth] Verificando token del header Authorization...');
      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: [
          'http://localhost:5173',
          'http://localhost:3000', 
          'http://localhost:3001',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001'
        ],
      });

      if (verified && 'sub' in verified && verified.sub) {
        logger.info('[Auth] userId desde verifyToken: %s', verified.sub);
        return verified.sub;
      }
    } catch (err: any) {
      logger.warn('[Auth] verifyToken falló: %s', err.message);
    }
  }

  // 2. Segundo: intentar con req.auth (inyectado por clerkMiddleware desde cookies)
  const reqAuth = (req as any).auth;
  if (reqAuth?.userId) {
    logger.info('[Auth] userId desde req.auth: %s', reqAuth.userId);
    return reqAuth.userId;
  }

  logger.error('[Auth] No se pudo extraer userId');
  try {
    logger.debug('   req.auth: %s', reqAuth ? JSON.stringify(reqAuth).slice(0, 200) : 'undefined');
  } catch {
    logger.debug('   req.auth: [non-serializable]');
  }
  logger.debug('   Authorization header: %s', authHeader ? `${authHeader.slice(0, 30)}...` : 'missing');

  return null;
}

// =============================================================================
// SYNC USER — Sincronizar usuario de Clerk a Supabase Auth
// =============================================================================
// POST /api/auth/sync-user
// Headers: Authorization: Bearer <clerk_session_token>

router.post('/sync-user', async (req: Request, res: Response) => {
  try {
    const clerkUserId = await extractUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No se pudo identificar al usuario',
      });
    }

    logger.info('[Sync] Sincronizando usuario %s con Supabase Auth', clerkUserId);

    const user = await clerkClient.users.getUser(clerkUserId);
    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El usuario no tiene email registrado en Clerk',
      });
    }

    const supabase = getSupabaseClient();
    const randomPassword = `clerk_sync_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    let createError: any = null;
    let created: any = null;

    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          name: user.fullName || user.username || '',
          avatar_url: user.imageUrl || null,
          clerk_id: clerkUserId,
        },
      });
      created = result.data;
      createError = result.error;
    } catch (err: any) {
      createError = err;
    }

    if (createError) {
      // Idempotente: si el email ya existe, considerarlo éxito pero IGUAL actualizar la tabla users_system
      if (createError.code === 'email_exists' ||
          createError.message?.includes('already registered') ||
          createError.message?.includes('already exists') ||
          createError.status === 422) {
        logger.info('[Sync] Usuario ya existe en Supabase Auth: %s', email);
        
        // Buscar usuario existente en Supabase Auth para obtener su ID
        const { data: authList, error: authListError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        }) as any;
        
        if (authListError) {
          logger.error('[Sync] Error listando usuarios de Auth: %s', authListError.message);
        }
        
        const authUser = authList?.users?.find((u: any) => u.email === email);
        
        if (authUser) {
          logger.info('[Sync] Usuario encontrado en Auth: ID=%s', authUser.id);
          
          // Verificar si ya está en la tabla users_system
          const { data: existingTableUser } = await supabase
            .from('users_system')
            .select('id, email')
            .eq('email', email)
            .single();
          
          logger.info('[Sync] Verificando si existe en users_system: email=%s', email);
          if (!existingTableUser) {
            logger.info('[Sync] NO existe en users_system, insertando...');
            // No está en la tabla users_system — insertarlo
            const randomPassword = `user_sync_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
            
            const { count } = await supabase
              .from('users_system')
              .select('*', { count: 'exact', head: true });
            
            // IMPORTANTE: Por defecto TODOS los usuarios son ADMIN
            const role = 'ADMIN';
            logger.info('[Sync] Cantidad actual de usuarios en users_system: count=%s, rol a asignar: %s', count, role);
            
            const { error: insertError } = await supabase.from('users_system').insert({
              id: authUser.id,
              email: email,
              password: randomPassword,
              name: user.fullName || user.username || '',
              role: role,
              avatar_url: user.imageUrl || null,
              bio: '',
              source: 'clerk',
            });
            
            if (insertError) {
              logger.error('[Sync] ❌ Error insertando en users_system: %s', insertError.message);
              logger.error('[Sync] ❌ Detalles: %o', insertError);
            } else {
              logger.info('[Sync] ✅ Usuario插入 en users_system con rol %s: %s', role, email);
            }
          } else {
            logger.info('[Sync] YA existe en users_system: id=%s', existingTableUser.id);
          }
        }
        
        return res.json({
          success: true,
          message: 'Usuario ya existe en Supabase Auth',
          data: { email },
        });
      }
      
      logger.error('Error creando usuario en Supabase Auth: %o', createError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: `Error al crear usuario: ${createError.message}`,
      });
    }

    // Verificar que el usuario se creó correctamente en Supabase Auth
    if (!created?.user) {
      logger.error('[Sync] createUser retornó null o sin user');
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error inesperado al crear usuario en Supabase Auth',
      });
    }
    logger.info('[Sync] Usuario creado en Supabase Auth: %s (id: %s)', created.user.email, created.user.id);
    // =============================================================================
    // SINCRONIZAR CON tabla users_system (gestión de roles)
    // =============================================================================
    // IMPORTANTE: Por defecto TODOS los usuarios son ADMIN
    // El primer usuario (admin principal) puede crear otros usuarios con otros roles
    const role = 'ADMIN';
    // Generar password aleatorio para la tabla users_system (la auth real la maneja Clerk)
    const userPassword = `user_sync_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    // Upsert en tabla users_system (idempotente por email)
    const { error: insertError } = await supabase
      .from('users_system')
      .upsert({
        id: created.user.id,
        email: created.user.email,
        password: userPassword,
        name: user.fullName || user.username || '',
        role: role,
        avatar_url: user.imageUrl || null,
        bio: '',
        source: 'clerk',
      }, { onConflict: 'email' });
    if (insertError) {
      logger.error('[Sync] Error insertando en tabla users_system: %s', insertError.message);
    } else {
      logger.info('[Sync] Usuario insertado en tabla users_system con rol: %s', role);
    }
    // Actualizar Clerk publicMetadata con el rol
    try {
      await clerkClient.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { role },
      });
      logger.info('[Sync] Rol actualizado en Clerk publicMetadata: %s', role);
    } catch (clerkErr: any) {
      logger.warn('[Sync] Error actualizando Clerk metadata: %s', clerkErr.message);
    }
    return res.status(201).json({
      success: true,
      data: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.user_metadata?.name || '',
        role: role,
      },
    });
  } catch (err: any) {
    logger.error('Error en sync-user: %o', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al sincronizar usuario',
    });
  }
});

// =============================================================================
// GET ME — Obtener datos del usuario actual desde Supabase Auth
// =============================================================================
// GET /api/auth/me
// Headers: Authorization: Bearer <clerk_session_token>

router.get('/me', async (req: Request, res: Response) => {
  try {
    const clerkUserId = await extractUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No autenticado',
      });
    }

    const supabase = getSupabaseClient();
    const user = await clerkClient.users.getUser(clerkUserId);
    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El usuario no tiene email registrado',
      });
    }

    // Buscar por clerk_id en metadata (Supabase genera UUIDs propios)
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    }) as any;

    if (listError) {
      logger.error('Error listando usuarios: %o', listError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al buscar usuario',
      });
    }

    const existingUser = userList?.users?.find(
      (u: any) => u.user_metadata?.clerk_id === clerkUserId || u.email === email
    );

    if (existingUser) {
      return res.json({
        success: true,
        data: {
          id: existingUser.id,
          supabaseUid: existingUser.id, // UID de Supabase Auth
          email: existingUser.email,
          name: existingUser.user_metadata?.name || '',
          avatar_url: existingUser.user_metadata?.avatar_url || null,
          created_at: existingUser.created_at,
        },
      });
    }

    // No existe — crear automáticamente
    const randomPassword = `clerk_sync_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const role = 'ADMIN'; // IMPORTANTE: Todos los usuarios son ADMIN por defecto

    let createErr: any = null;
    let created: any = null;

    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          name: user.fullName || user.username || '',
          avatar_url: user.imageUrl || null,
          clerk_id: clerkUserId,
          role: role, // Agregar rol al metadata
        },
      });
      created = result.data;
      createErr = result.error;
    } catch (err: any) {
      createErr = err;
    }

    if (createErr) {
      if (createErr.code === 'email_exists' ||
          createErr.message?.includes('already registered') ||
          createErr.message?.includes('already exists') ||
          createErr.status === 422) {
        return res.json({
          success: true,
          message: 'Usuario ya existe en Supabase Auth',
          data: { email },
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: `Error al crear usuario: ${createErr.message}`,
      });
    }

    if (!created?.user) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error inesperado al crear usuario',
      });
    }

    return res.json({
      success: true,
      data: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.user_metadata?.name || '',
        avatar_url: created.user.user_metadata?.avatar_url || null,
        created_at: created.user.created_at,
        role: role,
      },
    });
  } catch (err: any) {
    logger.error('Error en /me: %o', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener usuario',
    });
  }
});

// =============================================================================
// GET ME WITH UID — Obtener datos del usuario actual INCLUIDO el UID de Supabase Auth
// =============================================================================
router.get('/me-with-uid', async (req: Request, res: Response) => {
  try {
    const clerkUserId = await extractUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No autenticado',
      });
    }

    const supabase = getSupabaseClient();
    const user = await clerkClient.users.getUser(clerkUserId);
    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El usuario no tiene email registrado',
      });
    }

    // Buscar el usuario en Supabase Auth por email
    const { data: authList, error: authListError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    }) as any;

    if (authListError) {
      logger.error('Error listando usuarios de Auth: %o', authListError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al buscar usuario en Auth',
      });
    }

    const authUser = authList?.users?.find((u: any) => u.email === email);

    if (!authUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado en Supabase Auth',
      });
    }

    // Buscar también en la tabla users_system
    const { data: tableUser } = await supabase
      .from('users_system')
      .select('id, email, name, role')
      .eq('email', email)
      .single();

    return res.json({
      success: true,
      data: {
        clerkUserId: clerkUserId,
        supabaseAuthUid: authUser.id,
        email: authUser.email,
        name: user.fullName || user.username || '',
        roleInUsersTable: tableUser?.role || null,
        existsInUsersTable: !!tableUser,
      },
    });
  } catch (err: any) {
    logger.error('Error en /me-with-uid: %o', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al obtener datos del usuario',
    });
  }
});

// Exportar extractUserId para uso en otros módulos
export { extractUserId };

export default router;
