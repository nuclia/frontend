import { Classification } from '@nuclia/core';
import { Observable } from 'rxjs';

const SLUG_REGEX = /^[a-zA-Z0-9-_]+$/;
const DELIMITER = ',';

// Simple CSV parser following RFC 4180
export function parseCSV(content: string) {
  content += '\n'; // Force a line break at the end
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotedField = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = content[i + -1];
    const nextChar = content[i + 1];

    const firstFieldChar = currentField.length === 0;
    const fieldDelimiter = char === DELIMITER && !inQuotedField;
    const initialQuote = char === '"' && firstFieldChar;
    const lastQuote = char === '"' && !firstFieldChar && inQuotedField && prevChar !== '"' && nextChar !== '"';
    const lineBreak = ['\n', '\r'].includes(char) && !inQuotedField;
    const endOfRow = lineBreak && (currentField.length > 0 || prevChar === DELIMITER);

    // Handle special characters
    if (fieldDelimiter || endOfRow) {
      currentField = currentField.replace(/""/g, '"');
      currentRow.push(currentField);
      currentField = '';
      if (endOfRow) {
        rows.push(currentRow);
        currentRow = [];
      }
    } else if (initialQuote) {
      inQuotedField = true;
    } else if (lastQuote) {
      inQuotedField = false;
    } else if (lineBreak && !endOfRow) {
      // ignore
    } else {
      currentField += char;
    }
  }
  return rows;
}

export function readCSV(file: File): Observable<string[][]> {
  return new Observable((observer) => {
    const reader = new FileReader();
    reader.onload = () => {
      observer.next(parseCSV(reader.result as string));
      observer.complete();
    };
    reader.onerror = () => {
      observer.error();
    };
    reader.readAsText(file, 'UTF-8');
  });
}

// Parse labels like: 'labelset1/label1|labelset2/label2'
export function parseCSVLabels(labels: string): Classification[] | null {
  if (labels.length === 0) return [];
  let isValid = true;
  const parsedLabels = labels.split('|').map((label) => {
    const items = label.split('/');
    isValid &&= items.length === 2 && SLUG_REGEX.test(items[0].trim()) && items[1].trim().length > 0;
    return { labelset: items[0]?.trim(), label: items[1]?.trim() };
  });
  return isValid ? parsedLabels : null;
}

export const CSVSpecs = [
  'Use commas as field delimiter',
  'Fields containing commas or line breaks must be enclosed in double quotes',
  'Double quotes appearing inside a quoted field must be prefixed with an additional double quote',
  "Don't include a header line",
];
