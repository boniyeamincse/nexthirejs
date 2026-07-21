/**
 * Utility Types
 *
 * Common TypeScript utility types.
 */

/**
 * Makes a type nullable (T | null).
 */
export type Nullable<T> = T | null;

/**
 * Makes a type optional (T | undefined).
 */
export type Optional<T> = T | undefined;

/**
 * Extracts the value type from an object's values.
 *
 * @example
 * type Status = { active: 'active'; inactive: 'inactive' };
 * type StatusValue = ValueOf<Status>; // 'active' | 'inactive'
 */
export type ValueOf<TObject> = TObject[keyof TObject];