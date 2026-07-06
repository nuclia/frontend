import { formatKeyValueFieldValue } from '../key-value-field-value-formatter';

export interface ResourceKeyValueField {
  id: string;
  group: string;
  key: string;
  label: string;
  value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getKeyValueContainer(resource: unknown): Record<string, unknown> | null {
  if (!isRecord(resource)) {
    return null;
  }

  if (!isRecord(resource['data'])) {
    return null;
  }

  const keyValues = resource['data']['key_values'];
  if (isRecord(keyValues)) {
    return keyValues;
  }

  return null;
}

function getGroupData(groupValue: unknown): Record<string, unknown> | null {
  if (!isRecord(groupValue)) {
    return null;
  }

  // Only extract real KV content from SDK model: data.key_values.<schema>.value.data
  if (!isRecord(groupValue['value']) || !isRecord(groupValue['value']['data'])) {
    return null;
  }

  return groupValue['value']['data'];
}

export function extractResourceKeyValueFields(resource: unknown): ResourceKeyValueField[] {
  const keyValueContainer = getKeyValueContainer(resource);
  if (!keyValueContainer) {
    return [];
  }

  return Object.entries(keyValueContainer).reduce((allFields, [group, groupValue]) => {
    const groupData = getGroupData(groupValue);
    if (!groupData) {
      return allFields;
    }

    const groupFields = Object.entries(groupData).map(([key, value]) => ({
      id: `${group}.${key}`,
      group,
      key,
      label: key,
      value,
    }));
    return allFields.concat(groupFields);
  }, [] as ResourceKeyValueField[]);
}

export function formatResourceKeyValueValue(value: unknown): string {
  return formatKeyValueFieldValue(value);
}
