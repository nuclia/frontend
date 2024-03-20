import type { Classification, ParagraphClassification, TokenAnnotation, UserFieldMetadata } from './resource.models';
import { RetryConfig, timer } from 'rxjs';

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
      .map((entry) => entry.paragraphs as ParagraphClassification[])
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
      .map((entry) => entry.paragraphs as ParagraphClassification[])
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

export const sliceUnicode = (str: string | string[] | undefined, start?: number, end?: number): string => {
  if (!str) {
    return '';
  }
  // In JavaScript, '🤖'.length is 2, but all positions in API responses are based on Python
  // and in Python len('🤖') is 1.
  // By converting the string to an array, we can get the correct length and slicing becomes consistent with the API
  // (because the array will split the string into characters, no matter how long they are)
  if (!Array.isArray(str)) {
    str = Array.from(str);
  }
  return str.slice(start, end).join('');
};

export const lengthUnicode = (str: string | undefined) => {
  if (!str) {
    return 0;
  }
  return Array.from(str).length;
};

const retryDelays = [1000, 5000, 10000];
export const resourceRetryConfig: RetryConfig = {
  count: retryDelays.length,
  delay: (error, count) => {
    if (error?.status === 429) {
      return timer(retryDelays[count - 1]);
    } else {
      throw error;
    }
  },
};
