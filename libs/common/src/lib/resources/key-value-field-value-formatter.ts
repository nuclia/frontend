import { KVSchemaField, KVValue } from '@nuclia/core';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRenderablePrimitive(value: unknown): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function getRangeValues(value: Record<string, unknown>): [unknown, unknown] | null {
  const lowerUpper = [value['lower'], value['upper']];
  if (lowerUpper.every((entry) => entry !== undefined && entry !== null)) {
    return [lowerUpper[0], lowerUpper[1]];
  }

  const minMax = [value['min'], value['max']];
  if (minMax.every((entry) => entry !== undefined && entry !== null)) {
    return [minMax[0], minMax[1]];
  }

  const fromTo = [value['from'], value['to']];
  if (fromTo.every((entry) => entry !== undefined && entry !== null)) {
    return [fromTo[0], fromTo[1]];
  }

  return null;
}

function formatDateString(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatKeyValueFieldValue(
  value: KVValue | unknown,
  options?: { fieldType?: KVSchemaField['type'] },
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatKeyValueFieldValue(item, options)).join(', ');
  }

  if (isRecord(value)) {
    const range = getRangeValues(value);
    if (range) {
      return `${range[0]} – ${range[1]}`;
    }
    return 'Object';
  }

  if (options?.fieldType === 'date' && typeof value === 'string') {
    return formatDateString(value);
  }

  if (isRenderablePrimitive(value)) {
    return `${value}`;
  }

  return '—';
}
