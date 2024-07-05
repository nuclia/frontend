import type { JsonSchema } from '../../core';

export interface JsonAnswerItem {
  label: string;
  value: any;
  parameters?: JsonSchema;
  items?: JsonAnswerItem[][];
}
