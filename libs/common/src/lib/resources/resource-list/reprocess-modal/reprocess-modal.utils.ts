import { isOriginalFieldId } from '@flaps/core';
import { Resource, ResourceField } from '@nuclia/core';

const REPROCESSABLE_FIELD_TYPES = ['files', 'links', 'texts', 'conversations'];

export function getOriginalFields(resource: Resource | null): ResourceField[] {
  return Object.entries(resource?.data || {})
    .filter(([fieldType]) => REPROCESSABLE_FIELD_TYPES.includes(fieldType))
    .reduce((acc, [fieldType, fields]) => {
      acc.push(
        ...Object.entries(fields)
          .filter(([fieldId]) => isOriginalFieldId(fieldId))
          .map(([fieldId, field]) => ({
            ...field,
            field_id: fieldId,
            field_type: fieldType.slice(0, -1),
          })),
      );
      return acc;
    }, [] as ResourceField[]);
}
