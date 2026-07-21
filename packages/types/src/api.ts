/**
 * API Response Types
 *
 * Reusable types for API responses. These are infrastructure-level types
 * that do not include business-domain entities.
 */

/**
 * Success response wrapper for API calls.
 */
export interface ApiSuccessResponse<TData, TMeta = undefined> {
  success: true;
  data: TData;
  meta?: TMeta;
}

/**
 * Individual error detail in an error response.
 */
export interface ApiErrorDetail {
  /** Optional field name that caused the error */
  field?: string;
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Error response wrapper for API calls.
 */
export interface ApiErrorResponse {
  success: false;
  /** Summary error message */
  message: string;
  /** Detailed error list */
  errors?: ApiErrorDetail[];
  /** Request tracing identifier */
  requestId?: string;
}

/**
 * Union type for all API responses.
 */
export type ApiResponse<TData, TMeta = undefined> =
  | ApiSuccessResponse<TData, TMeta>
  | ApiErrorResponse;