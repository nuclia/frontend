import type { Classification, ParagraphAnnotation, TokenAnnotation, UserFieldMetadata } from './resource.models';

export const deDuplicateList = (a: any[]): any[] => {
  return [...new Set([...a].map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item));
};

export const setLabels: (
  fieldId: string,
  fieldType: string,
  paragraphId: string,
  labels: Classification[],
  allEntries: UserFieldMetadata[],
) => UserFieldMetadata[] = (
  fieldId: string,
  fieldType: string,
  paragraphId: string,
  labels: Classification[],
  allEntries: UserFieldMetadata[],
) => {
  // collect all tokens for the field
  const tokens = deDuplicateList(
    allEntries
      .filter((entry) => hasTokensForField(entry, fieldId, fieldType))
      .map((entry) => entry.token as TokenAnnotation[])
      .reduce((acc, val) => acc.concat(val), []),
  );
  // collect all paragraph labels for other paragraphs in the field
  const paragraphs = deDuplicateList(
    allEntries
      .filter((entry) => hasLabelsForField(entry, fieldId, fieldType))
      .map((entry) => entry.paragraphs as ParagraphAnnotation[])
      .reduce((acc, val) => acc.concat(val), []),
  );
  const valuesForOtherParagraphs = paragraphs.filter((p) => p.key !== paragraphId);
  // remove all existing entries for the field
  const filtered = allEntries.filter((entry) => entry.field.field !== fieldId || entry.field.field_type !== fieldType);
  // add the update entry
  const updatedParagraphs =
    labels.length > 0
      ? [...valuesForOtherParagraphs, { key: paragraphId, classifications: labels }]
      : valuesForOtherParagraphs;
  if (tokens.length > 0 || updatedParagraphs.length > 0) {
    return [
      ...filtered,
      {
        field: { field: fieldId, field_type: fieldType },
        token: tokens.length > 0 ? tokens : undefined,
        paragraphs: updatedParagraphs.length > 0 ? updatedParagraphs : undefined,
      },
    ];
  } else {
    return filtered;
  }
};

export const setEntities: (
  fieldId: string,
  fieldType: string,
  tokens: TokenAnnotation[],
  allEntries: UserFieldMetadata[],
) => UserFieldMetadata[] = (
  fieldId: string,
  fieldType: string,
  tokens: TokenAnnotation[],
  allEntries: UserFieldMetadata[],
) => {
  // collect all paragraph labels for the field
  const paragraphs = deDuplicateList(
    allEntries
      .filter((entry) => hasLabelsForField(entry, fieldId, fieldType))
      .map((entry) => entry.paragraphs as ParagraphAnnotation[])
      .reduce((acc, val) => acc.concat(val), []),
  );
  // remove all existing entries for the field
  const filtered = allEntries.filter((entry) => entry.field.field !== fieldId || entry.field.field_type !== fieldType);
  // add the update entry
  if (tokens.length > 0 || paragraphs.length > 0) {
    return [
      ...filtered,
      {
        field: { field: fieldId, field_type: fieldType },
        token: tokens.length > 0 ? tokens : undefined,
        paragraphs: paragraphs.length > 0 ? paragraphs : undefined,
      },
    ];
  } else {
    return filtered;
  }
};

const hasTokensForField = (entry: UserFieldMetadata, fieldId: string, fieldType: string) => {
  return entry.field.field === fieldId && entry.field.field_type === fieldType && entry.token && entry.token.length > 0;
};

const hasLabelsForField = (entry: UserFieldMetadata, fieldId: string, fieldType: string) => {
  return (
    entry.field.field === fieldId &&
    entry.field.field_type === fieldType &&
    entry.paragraphs &&
    entry.paragraphs.length > 0
  );
};
