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

/**
 * Parses a template string and extracts all field paths needed for evaluation.
 * Handles nested fields (user.role.name), array indices (tags[0].name),
 * and ignores function calls (UPPER()) and string literals.
 * @param template The template string to parse (e.g. "Hello {{ user.name }}")
 * @returns Array of unique field paths (e.g. ['user.name'])
 */
export function extractRequiredFields(template: string): string[] {
    if (!template) return [];

    const fields = new Set<string>();
    const regex = /{{(.*?)}}/g;
    let m;

    while ((m = regex.exec(template)) !== null) {
        let text = m[1];

        // 1. Remove string literals (both single and double quotes)
        text = text.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');

        // 2. Remove array indices [0] -> empty string
        //    Directus uses dot notation for querying, so tags[0].name becomes tags.name
        text = text.replace(/\[\d+\]/g, '');

        // 3. Find identifiers (words or dot-separated paths) NOT followed by (
        //    This effectively ignores function names like UPPER(
        const identRegex = /\b[a-zA-Z_][\w]*(\.[\w]+)*\b(?!\s*\()/g;

        const found = text.match(identRegex);

        if (found) {
            found.forEach(f => {
                // Filter out likely keywords
                if (!['true', 'false', 'null', 'undefined', 'and', 'or', 'not'].includes(f)) {
                    // Only add if it looks like a variable (at least one char)
                    if (f.length > 0) {
                        fields.add(f);
                    }
                }
            });
        }
    }

    return Array.from(fields);
}
