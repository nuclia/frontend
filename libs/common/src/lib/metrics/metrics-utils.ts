import { UsagePoint } from '@nuclia/core';
import { BooleanCondition, DateCondition, NumericCondition } from './metrics-filters';
import { differenceInCalendarMonths } from 'date-fns';

/**
 * Converts a YYYY-MM string into a date range spanning that full month.
 * Extracted from the identical `_getMonthRange()` private method duplicated
 * across all four activity-page services.
 */
export function getMonthRange(yearMonth: string): { from: string; to: string } {
  const [year, month] = yearMonth.split('-');
  const lastDay = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10), 0).getDate();
  return {
    from: `${yearMonth}-01`,
    to: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * Sums a single named metric across an array of UsagePoints.
 * Replaces nested `for (point) { for (metric) { if (metric.name === …) } }`
 * loops in cost-token and processing services.
 */
export function aggregateUsageMetric(usagePoints: UsagePoint[], metricName: string): number {
  return usagePoints
    .flatMap((point) => point.metrics ?? [])
    .filter((m) => m.name === metricName)
    .reduce((sum, m) => sum + m.value, 0);
}

/**
 * Applies a text-search filter to the filters object based on the column type:
 *  - `id` → parsed as integer, uses `eq`
 *  - `client_type` → exact match with `eq`
 *  - everything else → case-insensitive `ilike`
 *
 * Extracted from the identical branching logic in 3 services' `_buildFilters()`.
 */
export function applyTextSearchFilter(
  search: { term: string; column: string } | null,
  filters: Record<string, unknown>,
): void {
  if (!search?.term) return;
  if (search.column === 'id') {
    const parsed = Number.parseInt(search.term, 10);
    if (!isNaN(parsed)) {
      filters['id'] = { eq: parsed };
    }
  } else if (search.column === 'client_type') {
    filters[search.column] = { eq: search.term };
  } else {
    filters[search.column] = { ilike: search.term };
  }
}

/**
 * Applies an array of date filter conditions to the filters object.
 * Each condition maps to { date: { ge?: string, le?: string } }.
 * Multiple conditions on the same column are merged.
 */
export function applyDateConditions(conditions: DateCondition[], filters: Record<string, unknown>): void {
  for (const c of conditions) {
    if (!c.from && !c.to) continue;
    const existing = (filters[c.column] as Record<string, unknown>) ?? {};
    if (c.from) existing['ge'] = c.from;
    if (c.to) existing['le'] = c.to;
    filters[c.column] = existing;
  }
}

/**
 * Applies an array of numeric filter conditions to the filters object.
 * Merges multiple conditions on the same column (e.g. `gt` + `lt`).
 *
 * `stringColumns` lists columns whose API type is `ActivityLogFilter<string>`
 * even though the UI treats them as numeric (e.g. `status` in the cost-token page).
 */
export function applyNumericConditions(
  conditions: NumericCondition[],
  filters: Record<string, unknown>,
  stringColumns: string[] = [],
): void {
  for (const c of conditions) {
    const existing = (filters[c.column] as Record<string, unknown>) ?? {};
    existing[c.operation] = stringColumns.includes(c.column) ? String(c.value) : c.value;
    filters[c.column] = existing;
  }
}

/**
 * Applies an array of boolean filter conditions to the filters object.
 * Each condition maps to { eq: boolean }.
 */
export function applyBooleanConditions(conditions: BooleanCondition[], filters: Record<string, unknown>): void {
  for (const c of conditions) {
    filters[c.column] = { eq: c.value };
  }
}

export type RemiScoreStatus = 'good' | 'needs-review' | 'poor' | 'no-data';
export type RemiScoreLabel = 'Good' | 'Needs review' | 'Poor' | 'No data';
export type RemiScoreClass = 'remi-high' | 'remi-mid' | 'remi-low' | 'remi-no-data';

export interface RemiScoreDisplay {
  normalizedScore: number | null;
  displayValue: string;
  label: RemiScoreLabel;
  status: RemiScoreStatus;
  cssClass: RemiScoreClass;
}

/**
 * Normalizes REMi values coming from mixed scales into a 0-100 display scale.
 * Supported inputs:
 *  - 0..1   (fractional)
 *  - 0..5   (score)
 *  - 0..100 (percentage)
 *  - null/undefined (no data)
 */
export function getRemiScoreDisplay(rawValue: number | null | undefined): RemiScoreDisplay {
  if (rawValue === null || rawValue === undefined) {
    return {
      normalizedScore: null,
      displayValue: '—',
      label: 'No data',
      status: 'no-data',
      cssClass: 'remi-no-data',
    };
  }

  const as100Scale = rawValue <= 1 ? rawValue * 100 : rawValue <= 5 ? (rawValue / 5) * 100 : rawValue;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, as100Scale)));

  if (normalizedScore >= 80) {
    return {
      normalizedScore,
      displayValue: `${normalizedScore}/100`,
      label: 'Good',
      status: 'good',
      cssClass: 'remi-high',
    };
  }

  if (normalizedScore >= 50) {
    return {
      normalizedScore,
      displayValue: `${normalizedScore}/100`,
      label: 'Needs review',
      status: 'needs-review',
      cssClass: 'remi-mid',
    };
  }

  return {
    normalizedScore,
    displayValue: `${normalizedScore}/100`,
    label: 'Poor',
    status: 'poor',
    cssClass: 'remi-low',
  };
}

/**
 * Maps a numeric REMi score to a colour tier using normalized 0-100 thresholds.
 * low  → 0-49
 * mid  → 50-79
 * high → 80-100
 * Returns null when the value is absent so callers can skip styling entirely.
 */
export function getRemiColorClass(val: number | null | undefined): 'low' | 'mid' | 'high' | null {
  const display = getRemiScoreDisplay(val);
  if (display.status === 'no-data') return null;
  if (display.status === 'good') return 'high';
  if (display.status === 'needs-review') return 'mid';
  return 'low';
}

/**
 * Converts a Date object into a YYYY-MM string.
 */
export function formatDateToYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns an array of YYYY-MM strings representing each month from the given date to the current month.
 */
export function getMonthsSinceDate(date: Date): string[] {
  const diff = differenceInCalendarMonths(new Date(), date) + 1;
  const months = [];
  for (let i = 0; i < diff; i++) {
    const prevMonth = new Date();
    prevMonth.setUTCMonth(prevMonth.getUTCMonth() - i);
    months.push(prevMonth);
  }
  return months.map((month) => formatDateToYearMonth(month));
}
