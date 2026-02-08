<template>
	<div class="template-editor">
		<div class="mode-switch">
			<v-button x-small :secondary="mode !== 'visual'" @click="mode = 'visual'">Visual</v-button>
			<v-button x-small :secondary="mode !== 'raw'" @click="mode = 'raw'">Raw</v-button>
		</div>

		<div v-if="mode === 'visual'" class="visual-builder">
			<div class="grid">
				<v-select
					v-model="selectedOp"
					:items="operations"
					placeholder="Operation (e.g. SLUG)"
				/>
				
				<v-select
					v-model="selectedField"
					:items="fieldOptions"
					placeholder="Select Field"
				/>
			</div>
			
			<v-button full-width @click="appendTemplate">Add to Template</v-button>
		</div>

		<v-input 
            :model-value="internalValue" 
            :placeholder="mode === 'visual' ? 'Generated template...' : 'Type manually {{ ... }}'"
            :disabled="mode === 'visual'"
            @update:model-value="onInputChange"
        >
            <template #append>
                <v-icon name="code" />
            </template>
        </v-input>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed, inject, onMounted } from 'vue';
import { useStores } from '@directus/extensions-sdk';

const props = defineProps<{
    value: string;
    collection: string;
}>();

// Vue 3 Directus uses 'update:modelValue' for v-model binding
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'input', value: string): void;
}>();

const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();

// Inject the form state of the field configuration
const values = inject<any>('values', null);

const mode = ref('visual');
const internalValue = ref(props.value || '');
const selectedOp = ref('SLUG');
const selectedField = ref('');

// Extract collection from URL path: /admin/settings/data-model/{collection}/{field}
function getCollectionFromUrl(): string | null {
    try {
        const path = window.location.pathname;
        const match = path.match(/\/admin\/settings\/data-model\/([^/]+)/);
        if (match && match[1]) {
            return match[1];
        }
    } catch (e) {
        console.warn('[Template Editor] Could not extract collection from URL:', e);
    }
    return null;
}

// Computed property to get the REAL target collection
const targetCollection = computed(() => {
    // Method 1: Extract from URL (most reliable in data model settings)
    const urlCollection = getCollectionFromUrl();
    if (urlCollection) {
        return urlCollection;
    }
    
    // Method 2: values is a ref
    if (values?.value?.collection) {
        return values.value.collection;
    }
    // Method 3: values is already unwrapped (reactive object)
    if (values?.collection) {
        return values.collection;
    }
    // Fallback to props
    return props.collection;
});

// 1. Available Operations (including Bitwise from v3.3.0)
const operations = [
    // String
    { text: 'Slugify', value: 'SLUG' },
    { text: 'Uppercase', value: 'UPPER' },
    { text: 'Lowercase', value: 'LOWER' },
    { text: 'Trim', value: 'TRIM' },
    { text: 'Length', value: 'LENGTH' },
    { text: 'First Character', value: 'FIRST' },
    { text: 'Last Character', value: 'LAST' },
    { text: 'Reverse', value: 'REVERSE' },
    // Math
    { text: 'Sum', value: 'SUM' },
    { text: 'Absolute Value', value: 'ABS' },
    { text: 'Square Root', value: 'SQRT' },
    { text: 'Ceiling', value: 'CEIL' },
    { text: 'Floor', value: 'FLOOR' },
    { text: 'Round', value: 'ROUND' },
    // Date
    { text: 'Date ISO', value: 'DATE_ISO' },
    { text: 'Date String', value: 'DATE_STR' },
    { text: 'Year', value: 'YEAR' },
    { text: 'Month', value: 'MONTH' },
    // Boolean
    { text: 'Is Null', value: 'NULL' },
    { text: 'Is Not Null', value: 'NOT_NULL' },
    { text: 'Logical NOT', value: 'NOT' },
    // Bitwise (v3.3.0)
    { text: 'Bitwise NOT (~)', value: 'BIT_NOT' },
    // Binary Bitwise
    { text: 'Bitwise AND (&)', value: 'BIT_AND' },
    { text: 'Bitwise OR (|)', value: 'BIT_OR' },
    { text: 'Bitwise XOR (^)', value: 'BIT_XOR' },
    { text: 'Left Shift (<<)', value: 'BIT_LSHIFT' },
    { text: 'Right Shift (>>)', value: 'BIT_RSHIFT' },
    { text: 'Unsigned Right Shift (>>>)', value: 'BIT_URSHIFT' },
    // Type Conversion
    { text: 'To Integer', value: 'INT' },
    { text: 'To Float', value: 'FLOAT' },
    { text: 'To String', value: 'STRING' },
    { text: 'To Date', value: 'DATE' },
    // Format
    { text: 'Currency Format', value: 'CURRENCY' },
    { text: 'URL Encode', value: 'ENCODE_URL_COMPONENT' },
];

// 2. Fetch Fields for Target Collection
const fieldOptions = computed(() => {
    const collection = targetCollection.value;
    if (!collection) return [];
    
    try {
        const fields = fieldsStore.getFieldsForCollection(collection);
        if (!fields || !Array.isArray(fields)) return [];
        
        return fields
            .filter((f: any) => f.field && !f.field.startsWith('$')) // Exclude system fields
            .map((f: any) => ({
                text: f.name || f.field,
                value: f.field
            }));
    } catch (e) {
        console.warn('[Template Editor] Error fetching fields:', e);
        return [];
    }
});

// 3. Logic to Build String
function appendTemplate() {
    if (!selectedOp.value || !selectedField.value) {
        console.warn('[Template Editor] Missing op or field:', {
            op: selectedOp.value,
            field: selectedField.value
        });
        return;
    }
    
    // Simple logic: {{ OP(field) }}
    const newTag = `{{ ${selectedOp.value}(${selectedField.value}) }}`;
    
    // Append to existing value (one-way builder)
    internalValue.value = internalValue.value 
        ? `${internalValue.value} ${newTag}` 
        : newTag;
    
    // Emit for both legacy and modern Vue 3 patterns
    emit('update:modelValue', internalValue.value);
    emit('input', internalValue.value);
}

// Handle manual input in Raw mode
function onInputChange(val: string) {
    internalValue.value = val;
    emit('update:modelValue', val);
    emit('input', val);
}

// Sync with parent
watch(() => props.value, (newVal) => {
    internalValue.value = newVal || '';
});
</script>

<style scoped>
.template-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.mode-switch {
    display: flex;
    gap: 5px;
    margin-bottom: 5px;
}
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
}
</style>
