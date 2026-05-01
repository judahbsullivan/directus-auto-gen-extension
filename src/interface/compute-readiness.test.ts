import { describe, expect, test } from '@jest/globals';
import { getTemplateDependencyFields, isTemplateReadyForCompute } from './compute-readiness';

const productTypesRelation = {
  collection: 'product_types',
  related_collection: 'products',
  meta: {
    one_field: 'ProductTypes',
    many_field: 'product',
  },
};

describe('compute readiness', () => {
  test('constant formulas are ready immediately', () => {
    expect(
      isTemplateReadyForCompute({
        template: '{{SUM(1, 5)}}',
        values: {},
        defaultValues: {},
        computedField: 'auto_value',
        relations: [],
        collection: 'products',
      })
    ).toBe(true);
  });

  test('field formulas wait until required values exist', () => {
    const options = {
      template: '{{SUM(LENGTH(title), 5)}}',
      defaultValues: {},
      computedField: 'auto_value',
      relations: [],
      collection: 'products',
    };

    expect(isTemplateReadyForCompute({ ...options, values: {} })).toBe(false);
    expect(isTemplateReadyForCompute({ ...options, values: { title: 'Shorts' } })).toBe(true);
  });

  test('relation formulas wait for hydrated array values', () => {
    const options = {
      template: '{{SUM(LENGTH(ProductTypes), 5)}}',
      defaultValues: {},
      computedField: 'auto_value',
      relations: [productTypesRelation],
      collection: 'products',
    };

    expect(isTemplateReadyForCompute({ ...options, values: {} })).toBe(false);
    expect(isTemplateReadyForCompute({ ...options, values: { ProductTypes: null } })).toBe(false);
    expect(isTemplateReadyForCompute({ ...options, values: { ProductTypes: [] } })).toBe(true);
  });

  test('computed field is not treated as a dependency', () => {
    expect(getTemplateDependencyFields('{{CONCAT(title, auto_value)}}', 'auto_value')).toEqual(['title']);
  });

  test('dynamic variables are not treated as required fields', () => {
    expect(getTemplateDependencyFields('{{DATE_STR($NOW)}}', 'auto_value')).toEqual([]);
    expect(getTemplateDependencyFields('{{CONCAT($CURRENT_USER.first_name, title)}}', 'auto_value')).toEqual(['title']);
  });
});
