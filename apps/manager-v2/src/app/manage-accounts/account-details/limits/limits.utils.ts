import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeDefaults } from '@flaps/core';
import { AccountLimits, AccountLimitsPatchPayload } from '@nuclia/core';
import { LimitMode, toLimitMode, UNLIMITED } from '../account-details.utils';

export type LimitsGroupKey = 'usage' | 'upload';

const UPLOAD_LIMIT_KEYS = ['upload_limit_max_media_file_size', 'upload_limit_max_non_media_file_size'] as const;

const USAGE_LIMIT_KEYS = [
  'monthly_limit_docs_no_media_processed',
  'monthly_limit_hosted_answers_generated',
  'monthly_limit_hosted_searches_performed',
  'monthly_limit_media_seconds_processed',
  'monthly_limit_paragraphs_processed',
  'monthly_limit_paragraphs_stored',
  'monthly_limit_self_hosted_answers_generated',
  'monthly_limit_self_hosted_searches_performed',
  'storage_limit_max_bytes_per_kb',
  'storage_limit_max_resources_per_kb',
] as const;

export function buildLimitGroup(key: string, limit: number): FormGroup {
  return new FormGroup({
    [`${key}-radio`]: new FormControl<LimitMode>(toLimitMode(limit), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    limit: new FormControl<number>(limit, { validators: [Validators.required] }),
  });
}

export function toLimitFormValue(
  key: string,
  limit: number,
): { limit: number; [radioKey: string]: number | LimitMode } {
  return { limit, [`${key}-radio`]: toLimitMode(limit) };
}

export function toLimitsFormValue(
  limits: Partial<AccountLimits>,
): Record<string, Record<string, ReturnType<typeof toLimitFormValue>>> {
  return Object.fromEntries(
    Object.entries(limits).map(([groupKey, group]) => [
      groupKey,
      Object.fromEntries(
        Object.entries(group as Record<string, number>).map(([key, limit]) => [key, toLimitFormValue(key, limit)]),
      ),
    ]),
  );
}

export function toLimitsPayload(
  raw: Record<string, Record<string, Record<string, unknown>>>,
): AccountLimitsPatchPayload {
  const payload: Record<string, Record<string, number>> = {};
  Object.entries(raw).forEach(([groupKey, limits]) => {
    payload[groupKey] = {};
    Object.entries(limits).forEach(([key, limitData]) => {
      payload[groupKey][key] = limitData[`${key}-radio`] === 'unlimited' ? UNLIMITED : (limitData['limit'] as number);
    });
  });
  return payload as unknown as AccountLimitsPatchPayload;
}

export function getBulkLimitsPayload(value: typeof UNLIMITED | null): AccountLimitsPatchPayload {
  const fill = <K extends string>(keys: readonly K[]) =>
    Object.fromEntries(keys.map((key) => [key, value])) as Record<K, number | null>;
  return { upload: fill(UPLOAD_LIMIT_KEYS), usage: fill(USAGE_LIMIT_KEYS) };
}

export function getDefaultLimit(defaults: AccountTypeDefaults, key: string): number {
  return (defaults as unknown as Record<string, number>)[key];
}
