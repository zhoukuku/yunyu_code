/**
 * Standard paginated response format for list endpoints.
 */
export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/**
 * Create a standardized paginated response object.
 */
export function paginateResponse<T>(
  records: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    records,
    total,
    current: page,
    size: pageSize,
    pages: Math.ceil(total / pageSize),
  };
}

/**
 * Clamp page size to a maximum value to prevent performance issues.
 */
export function clampPageSize(size: number, max: number = 100): number {
  return Math.min(Math.max(1, size), max);
}
