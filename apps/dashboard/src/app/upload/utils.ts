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
