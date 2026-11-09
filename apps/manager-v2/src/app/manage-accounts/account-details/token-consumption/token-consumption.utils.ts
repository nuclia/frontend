import { NucliaTokensDetails } from '@nuclia/core';
import { set } from 'date-fns';

// digitsInfo format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}
export const DIGITS_INFO = '1.0-0';

export function isInvalidHour(hour: number): boolean {
  return hour < 0 || hour > 24;
}

export function toIsoDate(date: Date | undefined, hour: number): string {
  if (isInvalidHour(hour) || !date) {
    return '';
  }
  return set(date, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString();
}

export function getTotalTokens(tokens: NucliaTokensDetails['nuclia_tokens']): number | null {
  const { input, output, search, image, storage } = tokens;
  if (input === null && output === null && search === null && image === null && storage === null) {
    return null;
  }
  return (input || 0) + (output || 0) + (search || 0) + (image || 0) + (storage || 0);
}
