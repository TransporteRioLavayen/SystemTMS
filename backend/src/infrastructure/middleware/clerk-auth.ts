// =============================================================================
// CLERK AUTH MIDDLEWARE
// =============================================================================
// Infrastructure Layer - Middleware de autenticación con Clerk
// 
// Con @clerk/express ya instalado, este middleware:
// 1. Verifica que el usuario esté autenticado
// 2. Expone req.auth con los datos de Clerk
// 3. Proporciona utilidades de autorización por rol
// =============================================================================

import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

// =============================================================================
// TIPOS
// =============================================================================

/**
 * Roles disponibles en el sistema.
 * Se almacenan como metadata pública en Clerk (publicMetadata.role).
 */
export type UserRole = 'ADMIN' | 'OPERADOR' | 'VIEWER';

/**
 * Request extendido con datos de Clerk.
 * @clerk/express agrega req.auth automáticamente después de clerkMiddleware().
 */
export interface ClerkRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string | null>;
  };
}

// =============================================================================
// MIDDLEWARE PRINCIPAL
// =============================================================================

/**
 * Middleware de Clerk para Express.
 * 
 * DEBE ser el primer middleware después de los parsers de body.
 * Inyecta `req.auth` en cada request con sesión válida.
 * 
 * Uso en index.ts:
 *   app.use(clerkMiddleware());
 */
export { clerkMiddleware };

/**
 * Middleware que REQUIERE autenticación — VERSIÓN API (JSON).
 * 
 * IMPORTANTE: El requireAuth() original de Clerk hace un REDIRECT 302
 * cuando no hay sesión. Para APIs REST necesitamos un 401 JSON.
 * 
 * Uso en rutas:
 *   router.get('/', requireAuthJson, handler);
 */
export const requireAuthJson = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No autenticado. Envía un token válido en el header Authorization.',
      });
      return;
    }
    next();
  };
};

/**
 * @deprecated Usá requireAuthJson() en vez de requireAuth().
 * El requireAuth() original hace redirect 302, no 401 JSON.
 */
export { requireAuth };

// =============================================================================
// AUTORIZACIÓN POR ROL
// =============================================================================

/**
 * Middleware de autorización por rol.
 * Verifica que el usuario tenga uno de los roles permitidos.
 * 
 * Los roles se leen de req.auth.sessionClaims.publicMetadata.role
 * Si no tiene rol, permite el acceso pero logged (para desarrollo/migración).
 * 
 * @param roles - Array de roles permitidos
 * 
 * Uso en rutas:
 *   router.delete('/:id', requireAuth, authorizeRoles('ADMIN'), handler);
 *   router.post('/', requireAuth, authorizeRoles('ADMIN', 'OPERADOR'), handler);
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Clerk expone las claims del JWT en req.auth.sessionClaims
    const sessionClaims = (req as any).auth?.sessionClaims;
    const publicMetadata = sessionClaims?.publicMetadata as { role?: UserRole } | undefined;
    const userRole = publicMetadata?.role;

    // Si no tiene rol, permitir acceso pero warnear (migración/dev)
    // TODO: En producción,严格要求角色 cuando todos los usuarios tengan roles configurados
    if (!userRole) {
      console.warn(`⚠️ [Auth] Usuario sin rol detectado: ${(req as any).auth?.userId}. Permitiendo acceso.`);
      next();
      return;
    }

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Helper para obtener el Clerk user ID del request.
 * 
 * @param req - Express request
 * @returns El Clerk user ID (string)
 */
export const getClerkUserId = (req: Request): string | undefined => {
  return (req as any).auth?.userId;
};

/**
 * Helper para obtener el rol del usuario del request.
 * 
 * @param req - Express request
 * @returns El rol del usuario o undefined
 */
export const getUserRole = (req: Request): UserRole | undefined => {
  const sessionClaims = (req as any).auth?.sessionClaims;
  const publicMetadata = sessionClaims?.publicMetadata as { role?: UserRole } | undefined;
  return publicMetadata?.role;
};

/**
 * Middleware combinado: requiere auth + verifica rol.
 * Atajo para no repetir `requireAuth, authorizeRoles(...)`.
 * 
 * Uso en rutas:
 *   router.delete('/:id', requireAuthAndRole('ADMIN'), handler);
 */
export const requireAuthAndRole = (...roles: UserRole[]) => {
  return [requireAuth(), authorizeRoles(...roles)];
};
