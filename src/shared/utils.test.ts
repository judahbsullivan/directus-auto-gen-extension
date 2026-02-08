import { extractRequiredFields } from './utils';
import { describe, test, expect } from '@jest/globals';

describe('extractRequiredFields', () => {
    test('should extract simple nested fields', () => {
        const result = extractRequiredFields('Hello {{ user.name }}');
        expect(result).toEqual(['user.name']);
    });

    test('should extract multi-level nested fields', () => {
        const result = extractRequiredFields('{{ user.role.name }}');
        expect(result).toEqual(['user.role.name']);
    });

    test('should ignore function names', () => {
        const result = extractRequiredFields('{{ UPPER(author.name) }}');
        expect(result).toEqual(['author.name']);
    });

    test('should handle array indices', () => {
        const result = extractRequiredFields('{{ tags[0].name }}');
        expect(result).toEqual(['tags.name']);
    });

    test('should handle multiple variables', () => {
        const result = extractRequiredFields('{{ user.name }} and {{ category.title }}');
        expect(result).toEqual(['user.name', 'category.title']);
    });

    test('should strip string literals', () => {
        const result = extractRequiredFields("{{ replace(title, 'old', 'new') }}");
        expect(result).toEqual(['title']);
    });

    test('should deduplicate fields', () => {
        const result = extractRequiredFields('{{ user.name }} {{ user.name }}');
        expect(result).toEqual(['user.name']);
    });
});
