// =============================================================================
// VALIDATION MIDDLEWARE - BACKEND
// =============================================================================
// Middleware de validación usando Zod
// Aplica validación de schemas a los request bodies, queries y params

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Valida el body de la request contra un schema de Zod
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Valida los query params de la request contra un schema de Zod
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Valida los params de la request contra un schema de Zod
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors,
        });
      }
      next(error);
    }
  };
}

// =============================================================================
// SCHEMAS COMUNES - Reutilizables
// =============================================================================

// UUID validation
export const uuidSchema = z.string().uuid('ID inválido');

// Pagination query params
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

// Boolean query param transform
export const booleanSchema = z
  .string()
  .optional()
  .transform(val => val === 'true' ? true : val === 'false' ? false : undefined);

// =============================================================================
// ERROR HANDLER - Middleware para errores de Zod
// =============================================================================

export function validationErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    const errors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors,
    });
  }
  next(err);
}
