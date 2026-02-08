import { evaluateTemplate } from './evaluator';
import { describe, test, expect } from '@jest/globals';

describe('evaluateTemplate Recursive', () => {
    test('should resolve simple template', () => {
        const context = { name: 'World' };
        const result = evaluateTemplate('Hello {{ name }}', context);
        expect(result).toBe('Hello World');
    });

    test('should resolve recursive template (depth 2)', () => {
        const context = {
            name: '{{ full_name }}',
            full_name: 'John Doe'
        };
        // Template -> {{ name }} -> {{ full_name }} -> John Doe
        const result = evaluateTemplate('Hello {{ name }}', context);
        expect(result).toBe('Hello John Doe');
    });

    test('should resolve recursive template (depth 3)', () => {
        const context = {
            l1: '{{ l2 }}',
            l2: '{{ l3 }}',
            l3: 'Deep Value'
        };
        const result = evaluateTemplate('Level: {{ l1 }}', context);
        expect(result).toBe('Level: Deep Value');
    });

    test('should stop at max depth (circular protection)', () => {
        const context = {
            a: '{{ b }}',
            b: '{{ a }}'
        };
        // a -> b -> a -> b ... stops at depth 3
        // Result will likely contain {{ a }} or {{ b }} depending on where it stopped
        const result = evaluateTemplate('Circle: {{ a }}', context);
        // It should not crash or hang. It should return a string with braces still inside.
        expect(result).toContain('{{');
    });

    test('should verify default max depth is 3', () => {
        const context = {
            a: '{{ b }}',
            b: '{{ c }}',
            c: '{{ d }}',
            d: 'Too Deep'
        };
        // a -> b (1) -> c (2) -> d (3) -> Too Deep
        // Start: {{ a }}
        // Pass 1: {{ b }}
        // Pass 2: {{ c }}
        // Pass 3: {{ d }}
        // Pass 4: Too Deep (if depth < maxDepth allows it)

        // Loop runs while depth < maxDepth.
        // depth=0. 0<3. replace -> {{ b }}. depth=1.
        // depth=1. 1<3. replace -> {{ c }}. depth=2.
        // depth=2. 2<3. replace -> {{ d }}. depth=3.
        // depth=3. 3<3? FALSE. Loop ends.

        // So result is "{{ d }}"
        const result = evaluateTemplate('{{ a }}', context);
        expect(result).toBe('{{ d }}');
    });

    test('should allow custom max depth', () => {
        const context = {
            a: '{{ b }}',
            b: 'Final'
        };
        // custom depth 1
        // Pass 1: {{ b }}. depth becomes 1. Loop 1 < 1? False.
        // Result: {{ b }}
        const result = evaluateTemplate('{{ a }}', context, 1);
        expect(result).toBe('{{ b }}');
    });
});
