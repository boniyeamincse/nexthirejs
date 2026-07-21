/**
 * HTTP Constants
 *
 * Common HTTP-related constants for API requests.
 */

/** Default page number for paginated endpoints */
export const DEFAULT_PAGE = 1;

/** Default number of items per page for paginated endpoints */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum number of items per page for paginated endpoints */
export const MAX_PAGE_SIZE = 100;

/** HTTP header name for request tracing ID */
export const X_REQUEST_ID_HEADER = 'X-Request-Id';

/** HTTP header name for request tracing ID */
export const REQUEST_ID_HEADER = 'x-request-id';

/** HTTP header name for idempotency key */
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
