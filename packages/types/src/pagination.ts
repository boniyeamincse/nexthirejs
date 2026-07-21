/**
 * Pagination Types
 *
 * Cursor-based pagination types for consistent API pagination.
 */

/**
 * Metadata for cursor-based pagination.
 */
export interface CursorPaginationMeta {
  /** The cursor for the next page, or null if there are no more results */
  nextCursor: string | null;
  /** Whether there are more items after this page */
  hasMore: boolean;
  /** Number of items per page */
  perPage: number;
}

/**
 * Paginated data wrapper with cursor-based pagination.
 */
export interface CursorPaginatedData<TItem> {
  /** The items on the current page */
  items: TItem[];
  /** Pagination metadata */
  pagination: CursorPaginationMeta;
}
