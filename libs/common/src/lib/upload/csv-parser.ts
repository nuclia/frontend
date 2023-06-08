import { Classification } from '@nuclia/core';
import { parse } from 'papaparse';

const SLUG_REGEX = /^[a-zA-Z0-9-_]+$/;

// CSV parser following RFC 4180: https://github.com/mholt/PapaParse
export function parseCsv(content: string): string[][] {
  const parseResult = parse<string[]>(content, {});
  return parseResult.data;
}

// Parse labels like: 'labelset1/label1|labelset2/label2'
export function parseCsvLabels(labels: string): Classification[] | null {
  if (labels.length === 0) return [];
  let isValid = true;
  const parsedLabels = labels.split('|').map((label) => {
    const items = label.split('/');
    isValid &&= items.length === 2 && SLUG_REGEX.test(items[0].trim()) && items[1].trim().length > 0;
    return { labelset: items[0]?.trim(), label: items[1]?.trim() };
  });
  return isValid ? parsedLabels : null;
}
