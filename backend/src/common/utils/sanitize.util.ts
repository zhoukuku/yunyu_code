/**
 * Escape special LIKE pattern characters to prevent SQL injection in LIKE queries.
 * Should be used when user input is used in LIKE clauses.
 */
export function escapeLikePattern(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * @deprecated Use escapeLikePattern instead. This alias maintains backwards compatibility.
 */
export const sanitizeSearchInput = escapeLikePattern;
