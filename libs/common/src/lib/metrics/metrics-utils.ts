import { UsagePoint } from '@nuclia/core';
import { NumericCondition } from './metrics-filters';

/**
 * Converts a YYYY-MM string into a date range spanning that full month.
 * Extracted from the identical `_getMonthRange()` private method duplicated
 * across all four activity-page services.
 */
export function getMonthRange(yearMonth: string): { from: string; to: string } {
  const [year, month] = yearMonth.split('-');
  const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
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
    const parsed = parseInt(search.term, 10);
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
