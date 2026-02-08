// src/hook/index.ts
import { defineHook } from '@directus/extensions-sdk';
import { evaluateTemplate } from '../shared/evaluator.js'; // Import the shared logic

export default defineHook(({ filter }, { services }) => {
    const { ItemsService } = services;

    // Listen for Item Creation
    filter('items.create', async (input: any, meta: any, { schema, database }) => {
        return await applyCalculations(input, meta.collection, null, schema, services);
    });

    // Listen for Item Updates
    filter('items.update', async (input: any, meta: any, { schema, database }) => {
        // For updates, we need the CURRENT data to calculate correctly
        // e.g. If updating 'quantity', we need to fetch 'price' to calculate 'total'
        if (!schema) throw new Error('Schema is required for update hook');
        const existingItem = await new ItemsService(meta.collection, { schema, knex: database }).readOne(meta.keys[0]);

        // Merge existing data with the new input
        const mergedContext = { ...existingItem, ...input };

        return await applyCalculations(input, meta.collection, mergedContext, schema, services);
    });

    async function applyCalculations(payload: any, collection: string, context: any, schema: any, services: any) {
        const { FieldsService } = services;

        // 1. Fetch fields for this collection to find which ones are "Auto Gen"
        // (In production, CACHE this result to avoid DB hits on every request)
        const fieldsService = new FieldsService({ schema });
        const fields = await fieldsService.readAll(collection);

        const autoGenFields = fields.filter((f: any) =>
            f.meta?.interface === 'auto-gen-interface' ||
            f.meta?.interface === 'directus-auto-gen-extension'
        );
        console.log(`[Auto-Gen] Found ${autoGenFields.length} auto-gen fields for collection ${collection}`);

        // 2. Iterate over fields and calculate
        for (const field of autoGenFields) {
            const options = field.meta?.options || {};
            const { template, compute_if_empty } = options;

            // Skip if "Compute if Empty" is on, and the payload already has a value
            if (compute_if_empty && payload[field.field] !== undefined) {
                continue;
            }

            // 3. Run the calculation
            // If context is null (create), use payload. If context exists (update), use merged.
            const evalContext = context || payload;
            const calculatedValue = evaluateTemplate(template, evalContext);

            if (calculatedValue !== null && calculatedValue !== undefined) {
                payload[field.field] = calculatedValue;
            }
        }

        return payload;
    }
});
