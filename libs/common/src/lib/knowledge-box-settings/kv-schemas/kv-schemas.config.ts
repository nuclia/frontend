import type { KVFieldType } from '@nuclia/core';

export const KV_SCHEMA_LIST_CONFIG = {
  maxSchemas: 20,
  columns: ['name', 'description', 'fields', 'actions'],
  tableColumns: '2fr 2fr 3fr 80px',
  skeletonRows: [1, 2, 3],
} as const;

export type KvSchemaListColumn = (typeof KV_SCHEMA_LIST_CONFIG.columns)[number];

export const KV_SCHEMA_FORM_CONFIG = {
  maxFields: 50,
  columns: ['key', 'required', 'type', 'range', 'repeated', 'description'],
  centeredColumns: ['required', 'range', 'repeated'],
  fieldTypeOptions: ['text', 'integer', 'float', 'boolean', 'date'] as const satisfies readonly KVFieldType[],
  rangeEnabledTypes: ['integer', 'float', 'date'] as const satisfies readonly KVFieldType[],
  repeatedEnabledTypes: ['text'] as const satisfies readonly KVFieldType[],
  defaultFieldType: 'text' as const satisfies KVFieldType,
  identifierPattern: /^[^/.]{1,64}$/,
} as const;

export type KvSchemaFormColumn = (typeof KV_SCHEMA_FORM_CONFIG.columns)[number];
