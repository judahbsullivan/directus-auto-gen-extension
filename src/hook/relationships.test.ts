import { defineHook } from '@directus/extensions-sdk';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock defineHook to return the init function directly
jest.mock('@directus/extensions-sdk', () => ({
    defineHook: (fn: any) => fn,
}));

import hook from './index'; // The hook implementation

// Mock Services
const mockReadOne = jest.fn<any>();
const mockItemsService = jest.fn<any>().mockImplementation(() => ({
    readOne: mockReadOne,
}));
const mockReadAllFields = jest.fn<any>();
const mockFieldsService = jest.fn<any>().mockImplementation(() => ({
    readAll: mockReadAllFields,
}));

const mockServices = {
    ItemsService: mockItemsService,
    FieldsService: mockFieldsService,
};

const mockSchema = {};
const mockDatabase = {};

describe('Deep Fetch Reproduction Test (items.update)', () => {
    let handler: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Capture the hook handler
        const mockRegister: any = {
            filter: (event: string, fn: any) => { if (event === 'items.update') handler = fn; }
        };
        hook(mockRegister, { services: mockServices } as any);
    });

    test('should resolve nested fields with Deep Fetch', async () => {
        // 1. Setup Data
        // The FieldsService returns our auto-gen field definition
        mockReadAllFields.mockResolvedValue([
            {
                field: 'welcome_message',
                meta: {
                    interface: 'auto-gen-interface',
                    options: { template: 'Hello {{ user.name }}' }
                }
            }
        ]);

        // Mock readOne to return deep data when correct fields are requested
        mockReadOne.mockImplementation((key: any, query: any) => {
            const fields = query?.fields || [];
            // Check if we requested the nested field
            if (fields.includes('user.name')) {
                return Promise.resolve({ id: 1, user: { id: 10, name: "Alice" } });
            }
            // Fallback for shallow fetch
            return Promise.resolve({ id: 1, user: 10 });
        });


        // 2. Execute Hook
        // Payload is empty (just checking calculation on update)
        const payload: any = {};
        const meta = { collection: 'posts', keys: [1] };

        await handler(payload, meta, { schema: mockSchema, database: mockDatabase });

        // 3. Assert Success
        expect(payload).toHaveProperty('welcome_message');
        expect(payload['welcome_message']).toBe('Hello Alice');
    });
});
