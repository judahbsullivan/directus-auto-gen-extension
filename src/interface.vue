<template>
  <div v-if="mode" :style="customCss">
    <span class="prefix">{{ prefix }}</span>
    <span class="computed-value">{{ computedValue }}</span>
    <span class="suffix">{{ suffix }}</span>
  </div>
  <v-input v-else v-bind="$attrs" :field="field" :collection="collection" :primary-key="primaryKey" :model-value="value"
    @update:model-value="$emit('input', $event)" />
  <v-notice v-if="errorMsg" type="danger">{{ errorMsg }}</v-notice>
  <div>
    <!-- Button to trigger manual computation -->
    <button class="genbutton" @click="computeAndEmitValue">Generate</button>
  </div>
</template>
<style lang="css">
.genbutton {
  position: relative;
  display: flex;
  align-items: center;
  width: var(--v-button-width, auto);
  min-width: var(--v-button-min-width, 140px);
  height: var(--v-button-height, 44px);
  padding: var(--v-button-padding, 0 19px);
  color: var(--v-button-color, var(--foreground-inverted));
  font-weight: var(--v-button-font-weight, 600);
  font-size: var(--v-button-font-size, 16px);
  line-height: var(--v-button-line-height, 22px);
  text-decoration: none;
  background-color: var(--v-button-background-color, var(--theme--primary));
  border: var(--theme--border-width) solid var(--v-button-background-color, var(--theme--primary));
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: var(--fast) var(--transition);
  transition-property: background-color border;
  margin-top: 10px;
}

.genbutton:hover {
  color: var(--v-button-color-hover, var(--foreground-inverted));
  background-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
  border-color: var(--v-button-background-color-hover, var(--theme--primary-accent));
}
</style>

<script lang="ts">
import { defineComponent, ref, inject, watch, toRefs } from 'vue';
import { parseExpression } from './operations';
import { useDeepValues, useCollectionRelations } from './utils';
import { useCollection } from '@directus/extensions-sdk';

export default defineComponent({
  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    field: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: null,
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
      default: null,
    },
    suffix: {
      type: String,
      default: null,
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
  },
  emits: ['input'],
  setup(props, { emit }) {
    const defaultValues = useCollection(props.collection).defaults;
    const computedValue = ref<string | number | null>(props.value);
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

    // Function to compute the value manually when the button is clicked
    function computeAndEmitValue() {
      const newValue = compute();
      if (newValue !== props.value) {
        computedValue.value = newValue;
        emit('input', newValue);
      }
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
        return res;
      } catch (err) {
        errorMsg.value = err.message ?? 'Unknown error';
        return null;
      }
    }

    return {
      computedValue,
      errorMsg,
      computeAndEmitValue, // Return the function for button click
    };
  },
});
</script>
