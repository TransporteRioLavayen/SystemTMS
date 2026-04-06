// =============================================================================
// PAGINATION TYPES
// =============================================================================
// Domain Layer - Tipos reutilizables para paginación

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

/**
 * Parsea query params de paginación con valores por defecto.
 * page=1, limit=20 por defecto. Máximo limit=100.
 */
export function parsePagination(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20), 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Crea un resultado paginado a partir de datos y total.
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
