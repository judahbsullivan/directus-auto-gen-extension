<template>
	<v-input
		v-if="isEditing && !disabled"
		v-bind="$attrs"
		:field="field"
		:collection="collection"
		:primary-key="primaryKey"
		:model-value="computedValue"
		:autofocus="true"
		:placeholder="placeholder"
		@update:model-value="onChange"
		@blur="disableEdit"
	>
		<template v-if="iconLeft || renderedPrefix" #prepend>
			<v-icon v-if="iconLeft" :name="iconLeft" />
			<span class="prefixsuffix">{{ renderedPrefix }}</span>
		</template>
		<template v-if="renderedSuffix" #append>
			<span class="prefixsuffix">{{ renderedSuffix }}</span>
		</template>
	</v-input>

	<div v-else class="link-preview-mode">
		<v-icon v-if="iconLeft" :name="iconLeft" class="icon-left" />
		<a v-if="computedValue" :href="fullLink" target="_blank" class="link">
			{{ renderedPrefix + computedValue + renderedSuffix }}
		</a>
		<span v-else class="link" @click="!disabled && enableEdit">
			{{ renderedPrefix + (computedValue ? computedValue : placeholder || '') + renderedSuffix }}
		</span>

		<div class="action-buttons">
			<v-button v-if="!disabled" v-tooltip="t('edit')" x-small secondary icon class="action-button" @click="enableEdit">
				<v-icon name="edit" />
			</v-button>
			<v-button v-tooltip="t('auto_generate')" x-small secondary icon class="genbutton" @click="computeAndEmitValue">
				<v-icon name="auto_fix_high" />
			</v-button>
		</div>
	</div>

	<v-notice v-if="errorMsg" type="danger">{{ errorMsg }}</v-notice>
</template>

<script lang="ts">
import { defineComponent, ref, inject, computed, toRefs, ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseExpression } from './operations';
import { useDeepValues, useCollectionRelations } from './utils';
import { useCollection } from '@directus/extensions-sdk';

export default defineComponent({
	props: {
		value: {
			type: [String, Number],
			default: '',
		},
		field: {
			type: String,
			default: '',
		},
		type: {
			type: String,
			default: '',
		},
		collection: {
			type: String,
			default: '',
		},
		primaryKey: {
			type: [String, Number],
			default: '',
		},
		template: {
			type: String,
			default: '',
		},
		mode: {
			type: String,
			default: null,
		},
		prefix: {
			type: String,
			default: '',
		},
		suffix: {
			type: String,
			default: '',
		},
		customCss: {
			type: Object,
			default: null,
		},
		debugMode: {
			type: Boolean,
			default: false,
		},
		computeIfEmpty: {
			type: Boolean,
			default: false,
		},
		initialCompute: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		iconLeft: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const defaultValues = useCollection(props.collection).defaults;
		const computedValue = ref<string | number>(props.value ?? ''); // Ensure computedValue is not null
		const relations = useCollectionRelations(props.collection);
		const { collection, field, primaryKey } = toRefs(props);
		const values = useDeepValues(
			inject<ComputedRef<Record<string, any>>>('values')!,
			relations,
			collection,
			field,
			primaryKey,
			props.template
		);
		const errorMsg = ref<string | null>(null);
		const isEditing = ref(false);

		// Computed properties for renderedPrefix and renderedSuffix
		const renderedPrefix = computed(() => props.prefix || '');
		const renderedSuffix = computed(() => props.suffix || '');

		// Ensure full URL with the provided prefix if computedValue is not empty
		const fullLink = computed(() => {
			const url = computedValue.value ? computedValue.value.toString() : '';
			if (!url) return ''; // Return an empty string if computedValue is empty or null

			const fullUrl = props.prefix + url;
			return fullUrl.startsWith('http://') || fullUrl.startsWith('https://') ? fullUrl : `https://${fullUrl}`;
		});

		// Function to enable edit mode
		function enableEdit() {
			isEditing.value = true;
		}

		// Function to disable edit mode and save changes
		function disableEdit() {
			isEditing.value = false;
			emit('input', computedValue.value ?? ''); // Ensure we emit an empty string if computedValue is null
		}

		// Function to compute the value manually when the button is clicked
		function computeAndEmitValue() {
			const newValue = compute();
			computedValue.value = newValue ?? ''; // Set computedValue to an empty string if newValue is null
			emit('input', computedValue.value);
		}

		function compute() {
			try {
				const res = props.template.replace(/{{.*?}}/g, (match) => {
					const expression = match.slice(2, -2).trim();
					return parseExpression(expression, values.value, defaultValues.value, props.debugMode);
				});

				errorMsg.value = null;

				if (['integer', 'decimal', 'bigInteger'].includes(props.type)) {
					return parseInt(res) || 0;
				}
				if (['float'].includes(props.type)) {
					return parseFloat(res) || 0;
				}
				return res || ''; // Return an empty string if result is null or empty
			} catch (err) {
				errorMsg.value = err.message ?? 'Unknown error';
				return '';
			}
		}

		// Function to handle changes in v-input
		function onChange(value) {
			computedValue.value = value ?? ''; // Ensure computedValue is set to an empty string if null
		}

		return {
			t,
			computedValue,
			errorMsg,
			isEditing,
			renderedPrefix,
			renderedSuffix,
			fullLink,
			computeAndEmitValue,
			enableEdit,
			disableEdit,
			onChange,
		};
	},
});
</script>

<style lang="css" scoped>
.link-preview-mode {
	display: flex;
	align-items: center;
	min-height: var(--input-height);
}

.icon-left {
	margin-right: 8px;
}

.prefixsuffix {
	color: var(--foreground-subdued);
}

.link {
	color: var(--foreground-subdued);
	text-decoration: underline;
	word-break: break-word;
}

.action-buttons {
	display: flex;
	align-items: center;
	margin-left: 8px;
}

.action-button {
	margin-right: 8px;
}

.genbutton {
	display: flex;
	align-items: center;
	cursor: pointer;
	color: var(--v-button-color, var(--foreground-inverted));
}

a.link {
	color: var(--primary);
}

a.link:focus-visible,
a.link:hover {
	color: var(--primary-75);
}
</style>
