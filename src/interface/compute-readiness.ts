import { extractRequiredFields } from '../shared/utils.js';

interface Relation {
  collection: string;
  related_collection: string | null;
  meta?: {
    one_field?: string;
    many_field?: string;
  };
}

interface PathResult {
  found: boolean;
  value: unknown;
}

interface ReadinessOptions {
  template: string;
  values: Record<string, any>;
  defaultValues: Record<string, any>;
  computedField: string;
  relations: Relation[];
  collection: string;
}

function findValueByPathSafe(obj: Record<string, any> | undefined, path: string): PathResult {
  let value: unknown = obj;

  for (const segment of path.split('.')) {
    if (value !== null && typeof value === 'object' && segment in value) {
      value = (value as Record<string, any>)[segment];
    } else {
      return { found: false, value: null };
    }
  }

  return { found: true, value };
}

function getRootField(path: string) {
  return path.split('.')[0] || path;
}

function findRelationForField(relations: Relation[], field: string) {
  return relations.find((relation) =>
    [relation.meta?.one_field, relation.meta?.many_field].includes(field)
  );
}

function isDynamicVariable(field: string) {
  return field === 'NOW' || field === 'CURRENT_USER' || field.startsWith('CURRENT_USER.');
}

export function getTemplateDependencyFields(template: string, computedField: string) {
  return extractRequiredFields(template)
    .map((field) => field.trim())
    .filter((field) => field && field !== computedField && !field.startsWith('$') && !isDynamicVariable(field));
}

export function isTemplateReadyForCompute({
  template,
  values,
  defaultValues,
  computedField,
  relations,
  collection,
}: ReadinessOptions) {
  const fields = getTemplateDependencyFields(template, computedField);

  if (!fields.length) {
    return true;
  }

  return fields.every((field) => {
    const rootField = getRootField(field);
    const relation = findRelationForField(relations, rootField);
    const pathToCheck = relation ? rootField : field;
    const valueResult = findValueByPathSafe(values, pathToCheck);
    const defaultResult = findValueByPathSafe(defaultValues, pathToCheck);

    if (!valueResult.found && !defaultResult.found) {
      return false;
    }

    const value = valueResult.found ? valueResult.value : defaultResult.value;

    if (value === undefined) {
      return false;
    }

    if (!relation) {
      return true;
    }

    const isM2O = relation.collection === collection;

    if (isM2O) {
      return valueResult.found;
    }

    return Array.isArray(value);
  });
}
