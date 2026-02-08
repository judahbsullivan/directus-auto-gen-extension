import { parseExpression } from './evaluator';
import { describe, test, expect } from '@jest/globals';

describe('Bitwise Operations', () => {
    // BIT_AND: 5 & 3 = 1 (0101 & 0011 = 0001)
    test('BIT_AND(5, 3) should equal 1', () => {
        const result = parseExpression('BIT_AND(5, 3)', {});
        expect(result).toBe(1);
    });

    // BIT_OR: 5 | 3 = 7 (0101 | 0011 = 0111)
    test('BIT_OR(5, 3) should equal 7', () => {
        const result = parseExpression('BIT_OR(5, 3)', {});
        expect(result).toBe(7);
    });

    // BIT_XOR: 5 ^ 3 = 6 (0101 ^ 0011 = 0110)
    test('BIT_XOR(5, 3) should equal 6', () => {
        const result = parseExpression('BIT_XOR(5, 3)', {});
        expect(result).toBe(6);
    });

    // BIT_NOT: ~5 = -6 (~00000101 = 11111010 in two's complement)
    test('BIT_NOT(5) should equal -6', () => {
        const result = parseExpression('BIT_NOT(5)', {});
        expect(result).toBe(-6);
    });

    // BIT_LSHIFT: 5 << 1 = 10 (0101 << 1 = 1010)
    test('BIT_LSHIFT(5, 1) should equal 10', () => {
        const result = parseExpression('BIT_LSHIFT(5, 1)', {});
        expect(result).toBe(10);
    });

    // BIT_RSHIFT: 10 >> 1 = 5 (1010 >> 1 = 0101)
    test('BIT_RSHIFT(10, 1) should equal 5', () => {
        const result = parseExpression('BIT_RSHIFT(10, 1)', {});
        expect(result).toBe(5);
    });

    // BIT_URSHIFT: -1 >>> 0 = 4294967295 (all 1s as unsigned)
    test('BIT_URSHIFT(-1, 0) should equal 4294967295', () => {
        const result = parseExpression('BIT_URSHIFT(-1, 0)', {});
        expect(result).toBe(4294967295);
    });

    // Edge case: float inputs should be truncated to 32-bit int
    test('BIT_AND(5.9, 3.1) should treat inputs as integers (5 & 3 = 1)', () => {
        const result = parseExpression('BIT_AND(5.9, 3.1)', {});
        expect(result).toBe(1);
    });

    // Edge case: string inputs should be converted
    test('BIT_OR with variable context', () => {
        const result = parseExpression('BIT_OR(flags, mask)', { flags: 5, mask: 3 });
        expect(result).toBe(7);
    });
});
