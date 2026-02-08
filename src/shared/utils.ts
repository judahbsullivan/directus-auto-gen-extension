/**
 * Shared utility functions for the Auto Gen extension.
 * These are pure functions with no DOM or framework dependencies,
 * safe for use in both client (Vue) and server (Hook) contexts.
 */

/**
 * Traverse an object by a dot-separated path and return the value.
 * @example findValueByPath({ a: { b: 1 } }, 'a.b') => { value: 1, found: true }
 */
export const findValueByPath = (obj: Record<string, any>, path: string) => {
    let value = obj;
    for (const i of path.split('.')) {
        if (i in value) {
            value = value[i];
        } else {
            return { value: null, found: false };
        }
    }
    return { value, found: true };
};

/**
 * Type guard to check if a value is a string.
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string' || value instanceof String;
}
