import type { Classification, ParagraphClassification, UserFieldMetadata } from './resource.models';
import { delay, of, RetryConfig } from 'rxjs';

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
  if (updatedParagraphs.length > 0) {
    return [
      ...filtered,
      {
        field: { field: fieldId, field_type: fieldType },
        paragraphs: updatedParagraphs,
      },
    ];
  } else {
    return filtered;
  }
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

export const retry429Config = (maxWaitOn429 = 30000): RetryConfig => ({
  count: 3,
  delay: (error, index) => {
    const tryAfter = error?.body?.detail?.try_after;
    if (error?.status === 429 && tryAfter) {
      const delayOn429 = Math.min(tryAfter * 1000 - Date.now(), maxWaitOn429);
      return of(true).pipe(delay(delayOn429));
    } else if (error?.status === 429 && !tryAfter) {
      const delays = [1000, 5000, 10000];
      return of(true).pipe(delay(delays[index]));
    } else {
      throw error;
    }
  },
});
