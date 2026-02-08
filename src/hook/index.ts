// src/hook/index.ts
import { defineHook } from '@directus/extensions-sdk';
import { evaluateTemplate } from '../shared/evaluator.js'; // Import the shared logic
import { extractRequiredFields } from '../shared/utils.js';

export default defineHook(({ filter }, { services }) => {
    const { ItemsService } = services;

    // Listen for Item Creation
    filter('items.create', async (input: any, meta: any, { schema, database }) => {
        if (!schema) return;

        const { FieldsService } = services;
        const fieldsService = new FieldsService({ schema });
        const fieldsDefs = await fieldsService.readAll(meta.collection);

        const autoGenFields = fieldsDefs.filter((f: any) =>
            f.meta?.interface === 'auto-gen-interface' ||
            f.meta?.interface === 'directus-auto-gen-extension'
        );

        // For create, context is just the input (no deep fetch possible yet)
        return await applyCalculations(input, autoGenFields, input);
    });

    // Listen for Item Updates
    filter('items.update', async (input: any, meta: any, { schema, database }) => {
        if (!schema) throw new Error('Schema is required for update hook');

        // 1. Fetch fields defs to know which templates we need to parse
        const { FieldsService } = services;
        const fieldsService = new FieldsService({ schema });
        const fieldsDefs = await fieldsService.readAll(meta.collection);

        const autoGenFields = fieldsDefs.filter((f: any) =>
            f.meta?.interface === 'auto-gen-interface' ||
            f.meta?.interface === 'directus-auto-gen-extension'
        );

        // 2. Extract required fields from templates
        const requiredFields = new Set<string>(['*']); // Always fetch local fields

        // We also need to fetch fields that are being computed, in case they are self-referencing? 
        // No, usually we reference OTHER fields.

        for (const field of autoGenFields) {
            const template = field.meta?.options?.template;
            if (template) {
                const extracted = extractRequiredFields(template);
                extracted.forEach(f => requiredFields.add(f));
            }
        }

        // 3. Fetch the existing item with DEEP fields
        const itemsService = new ItemsService(meta.collection, { schema, knex: database });
        const existingItem = await itemsService.readOne(meta.keys[0], {
            fields: Array.from(requiredFields)
        });

        // 4. Merge existing data with the new input
        // Note: input (payload) takes precedence over existingItem
        const mergedContext = { ...existingItem, ...input };

        return await applyCalculations(input, autoGenFields, mergedContext);
    });

    // Separated logic: applyCalculations now takes pre-filtered fields
    async function applyCalculations(payload: any, autoGenFields: any[], context: any) {
        console.log(`[Auto-Gen] Processing ${autoGenFields.length} fields with context keys:`, Object.keys(context));

        // Iterate over fields and calculate
        for (const field of autoGenFields) {
            const options = field.meta?.options || {};
            const { template, compute_if_empty } = options;

            if (!template) continue;

            // Skip if "Compute if Empty" is on, and the payload already has a value
            // (Use payload specifically to see if user manually supplied it)
            if (compute_if_empty && payload[field.field] !== undefined) {
                continue;
            }

            // Run the calculation
            const calculatedValue = evaluateTemplate(template, context);

            if (calculatedValue !== null && calculatedValue !== undefined) {
                payload[field.field] = calculatedValue;
            }
        }

        return payload;
    }
});
