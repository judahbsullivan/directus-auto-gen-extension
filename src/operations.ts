/**
 * Re-export from shared module for backward compatibility.
 * The actual implementation is now in src/shared/evaluator.ts
 * so it can be used by both the Vue interface and the server-side hook.
 */
export { parseExpression, parseOp, toSlug, evaluateTemplate } from './shared/evaluator.js';
