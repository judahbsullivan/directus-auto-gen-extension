<template>
  <v-input v-if="isEditing && !disabled" v-bind="inputAttrs" :field="field" :collection="collection"
    :primary-key="primaryKey" :model-value="computedValue" :autofocus="true" :placeholder="placeholder"
    @update:model-value="onChange" @blur="disableEdit">
    <template v-if="iconLeft || renderedPrefix" #prepend>
      <v-icon v-if="iconLeft" :name="iconLeft" />
      <span class="prefixsuffix">{{ renderedPrefix }}</span>
    </template>
    <template v-if="renderedSuffix" #append>
      <span class="prefixsuffix">{{ renderedSuffix }}</span>
    </template>
  </v-input>

  <div v-else class="readonly-preview-mode">
    <v-icon v-if="iconLeft" :name="iconLeft" class="icon-left" />
    <v-input
      :model-value="renderedPrefix + (computedValue || '') + renderedSuffix"
      disabled
      :placeholder="placeholder || 'Auto-generated...'"
      class="readonly-input"
    >
      <template v-if="iconLeft" #prepend>
        <v-icon :name="iconLeft" />
      </template>
    </v-input>

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
import { defineComponent, ref, watch, inject, computed, toRefs, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseExpression } from '../operations.js';
import { useDeepValues, useCollectionRelations } from '../utils.js';
import { useCollection } from '@directus/extensions-sdk';

export default defineComponent({
  inheritAttrs: false,
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
      default: 'string',
    },
    collection: {
      type: String,
      required: true,
    },
    primaryKey: {
      type: [String, Number],
      default: '+',
    },
    template: {
      type: String,
      default: '',
    },
    mode: String,
    prefix: String,
    suffix: String,
    customCss: Object,
    debugMode: Boolean,
    computeIfEmpty: Boolean,
    initialCompute: Boolean,
    disabled: Boolean,
    placeholder: String,
    iconLeft: String,
  },
  emits: ['update:modelValue', 'input'],
  setup(props, { emit, attrs }) {
    const { t } = useI18n();

    const collectionName = props.collection || '';
    const defaultValues = useCollection(collectionName).defaults;
    const computedValue = ref(props.value || '');
    const relations = useCollectionRelations(collectionName);
    const values = useDeepValues(
      inject('values')!,
      relations,
      toRefs(props).collection as any, // Cast to any to avoid strict Ref type mismatch
      toRefs(props).field as any,
      toRefs(props).primaryKey as any,
      props.template || ''
    );

    const errorMsg = ref<string | null>(null);
    const isEditing = ref(false);
    const inputAttrs = computed(() => {
      const filtered: Record<string, unknown> = { ...attrs };
      delete filtered.modelValue;
      delete filtered.value;
      delete filtered.onInput;
      delete filtered['onUpdate:modelValue'];
      return filtered;
    });

    const renderedPrefix = ref(props.prefix || '');
    const renderedSuffix = computed(() => props.suffix || '');

    const fullLink = computed(() => {
      const url = computedValue.value ? computedValue.value.toString() : '';
      if (!url) return '';
      const fullUrl = renderedPrefix.value + url;
      return fullUrl.startsWith('http://') || fullUrl.startsWith('https://') ? fullUrl : `https://${fullUrl}`;
    });

    // Initialize prefix on mount
    onMounted(() => {
      renderedPrefix.value = props.prefix || '';
    });

    // Enable edit mode
    function enableEdit() {
      isEditing.value = true;
    }

    function emitValue(value: string | number) {
      const normalized = String(value);
      emit('update:modelValue', normalized);
      emit('input', normalized);
    }

    // Disable edit mode and emit changes
    function disableEdit() {
      isEditing.value = false;
      emitValue(computedValue.value);
    }

    // Compute value and emit
    function computeAndEmitValue() {
      const newValue = compute();
      computedValue.value = newValue;
      emitValue(newValue);
    }

    // Handle manual input changes from Directus v-input and native events.
    function onChange(value: unknown) {
      if (typeof value === 'string' || typeof value === 'number') {
        computedValue.value = String(value);
        emitValue(computedValue.value);
        return;
      }

      if (value && typeof value === 'object') {
        const eventLike = value as {
          target?: { value?: unknown };
          currentTarget?: { value?: unknown };
          srcElement?: { value?: unknown };
          value?: unknown;
        };

        const fromTarget = eventLike.target?.value;
        const fromCurrentTarget = eventLike.currentTarget?.value;
        const fromSrcElement = eventLike.srcElement?.value;
        const directValue = eventLike.value;

        const resolved =
          fromTarget ?? fromCurrentTarget ?? fromSrcElement ?? directValue;

        if (typeof resolved === 'string' || typeof resolved === 'number') {
          computedValue.value = String(resolved);
          emitValue(computedValue.value);
        }
      }
    }

    // Compute the value using the template
    function compute() {
      if (!props.template) return '';
      try {
        const result = props.template.replace(/{{.*?}}/g, (match) => {
          const expression = match.slice(2, -2).trim();
          return parseExpression(expression, values.value, defaultValues.value, props.debugMode);
        });

        errorMsg.value = null;
        if (['integer', 'decimal', 'bigInteger'].includes(props.type || '')) return parseInt(result) || 0;
        if (props.type === 'float') return parseFloat(result) || 0;
        return result || '';
      } catch (err: unknown) {
        errorMsg.value = (err instanceof Error ? err.message : String(err)) || 'Error computing value';
        return '';
      }
    }

    // Watch for prop changes to update computedValue
    watch(
      () => props.value,
      (newValue) => {
        if (typeof newValue === 'string' || typeof newValue === 'number') {
          computedValue.value = String(newValue);
          return;
        }
        computedValue.value = '';
      }
    );

    // Set initial state on mount
    onMounted(() => {
      computedValue.value = props.value || '';
      isEditing.value = !!props.value; // Enable edit mode if value exists
    });

    return {
      t,
      computedValue,
      errorMsg,
      isEditing,
      renderedPrefix,
      renderedSuffix,
      fullLink,
      enableEdit,
      disableEdit,
      computeAndEmitValue,
      onChange,
      inputAttrs,
    };
  },
});
</script>

<style scoped>
.readonly-preview-mode {
  display: flex;
  align-items: center;
  min-height: var(--input-height);
  gap: 8px;
}

.icon-left {
  margin-right: 8px;
}

.prefixsuffix {
  color: var(--foreground-subdued);
}

.readonly-input {
  flex: 1;
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
}
</style>

