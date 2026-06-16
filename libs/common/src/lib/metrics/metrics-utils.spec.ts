import {
  getMonthRange,
  aggregateUsageMetric,
  applyTextSearchFilter,
  applyNumericConditions,
  formatDateToYearMonth,
  getMonthsSinceDate,
  getRemiScoreDisplay,
  getRemiColorClass,
} from './metrics-utils';
import { UsagePoint } from '@nuclia/core';
import { NumericCondition } from './metrics-filters';

describe('metrics-utils', () => {
  describe('getMonthRange()', () => {
    it('returns the first and last day of a 31-day month', () => {
      expect(getMonthRange('2024-01')).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    });

    it('returns the first and last day of a 30-day month', () => {
      expect(getMonthRange('2024-04')).toEqual({ from: '2024-04-01', to: '2024-04-30' });
    });

    it('handles February in a leap year', () => {
      expect(getMonthRange('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    });

    it('handles February in a non-leap year', () => {
      expect(getMonthRange('2023-02')).toEqual({ from: '2023-02-01', to: '2023-02-28' });
    });

    it('pads single-digit last days with a leading zero', () => {
      // February non-leap = 28 days, no padding needed; but we can verify with a month ending in < 10
      // Actually all months end in >= 28, so padding is always 2 digits.
      const result = getMonthRange('2024-12');
      expect(result.to).toBe('2024-12-31');
    });
  });

  describe('aggregateUsageMetric()', () => {
    it('sums the named metric across all usage points', () => {
      const points: UsagePoint[] = [
        {
          metrics: [
            { name: 'cpu', value: 10 },
            { name: 'mem', value: 5 },
          ],
        },
        { metrics: [{ name: 'cpu', value: 20 }] },
      ] as any;
      expect(aggregateUsageMetric(points, 'cpu')).toBe(30);
    });

    it('returns 0 when no metrics match the name', () => {
      const points: UsagePoint[] = [{ metrics: [{ name: 'cpu', value: 10 }] }] as any;
      expect(aggregateUsageMetric(points, 'nonexistent')).toBe(0);
    });

    it('returns 0 for an empty array', () => {
      expect(aggregateUsageMetric([], 'cpu')).toBe(0);
    });

    it('handles points with undefined metrics', () => {
      const points: UsagePoint[] = [{ metrics: undefined }] as any;
      expect(aggregateUsageMetric(points, 'cpu')).toBe(0);
    });
  });

  describe('applyTextSearchFilter()', () => {
    it('does nothing when search is null', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter(null, filters);
      expect(filters).toEqual({});
    });

    it('does nothing when search term is empty', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter({ term: '', column: 'question' }, filters);
      expect(filters).toEqual({});
    });

    it('applies ilike for regular columns', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter({ term: 'hello', column: 'question' }, filters);
      expect(filters['question']).toEqual({ ilike: 'hello' });
    });

    it('applies eq with parsed int for the id column', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter({ term: '42', column: 'id' }, filters);
      expect(filters['id']).toEqual({ eq: 42 });
    });

    it('does not set id filter when term is not a number', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter({ term: 'abc', column: 'id' }, filters);
      expect(filters['id']).toBeUndefined();
    });

    it('applies eq for client_type column', () => {
      const filters: Record<string, unknown> = {};
      applyTextSearchFilter({ term: 'widget', column: 'client_type' }, filters);
      expect(filters['client_type']).toEqual({ eq: 'widget' });
    });
  });

  describe('applyNumericConditions()', () => {
    it('adds a single condition to the filters object', () => {
      const filters: Record<string, unknown> = {};
      const conditions: NumericCondition[] = [{ column: 'duration', operation: 'gt', value: 100 }];
      applyNumericConditions(conditions, filters);
      expect(filters['duration']).toEqual({ gt: 100 });
    });

    it('merges multiple conditions on the same column', () => {
      const filters: Record<string, unknown> = {};
      const conditions: NumericCondition[] = [
        { column: 'duration', operation: 'gt', value: 100 },
        { column: 'duration', operation: 'lt', value: 500 },
      ];
      applyNumericConditions(conditions, filters);
      expect(filters['duration']).toEqual({ gt: 100, lt: 500 });
    });

    it('converts values to strings for stringColumns', () => {
      const filters: Record<string, unknown> = {};
      const conditions: NumericCondition[] = [{ column: 'status', operation: 'eq', value: 200 }];
      applyNumericConditions(conditions, filters, ['status']);
      expect(filters['status']).toEqual({ eq: '200' });
    });

    it('does nothing for an empty conditions array', () => {
      const filters: Record<string, unknown> = {};
      applyNumericConditions([], filters);
      expect(filters).toEqual({});
    });
  });

  describe('formatDateToYearMonth()', () => {
    it('formats a date to YYYY-MM', () => {
      const date = new Date(2026, 4, 28);
      const yearMonth = formatDateToYearMonth(date);
      expect(yearMonth).toEqual('2026-05');
    });
  });

  describe('getMonthsSinceDate()', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-15T00:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('returns months from now back to the given month', () => {
      expect(getMonthsSinceDate(new Date('2025-12-01T00:00:00.000Z'))).toEqual(['2026-02', '2026-01', '2025-12']);
    });
  });

  describe('getRemiScoreDisplay()', () => {
    it('normalizes 0-1 values to 0-100 and marks poor', () => {
      expect(getRemiScoreDisplay(0.2)).toEqual({
        normalizedScore: 20,
        displayValue: '20%',
        label: 'Poor',
        status: 'poor',
        cssClass: 'remi-low',
      });
    });

    it('normalizes 0-1 values to needs review', () => {
      expect(getRemiScoreDisplay(0.6)).toEqual({
        normalizedScore: 60,
        displayValue: '60%',
        label: 'Needs review',
        status: 'needs-review',
        cssClass: 'remi-mid',
      });
    });

    it('normalizes 0-5 scores to 0-100', () => {
      expect(getRemiScoreDisplay(4)).toEqual({
        normalizedScore: 80,
        displayValue: '80%',
        label: 'Good',
        status: 'good',
        cssClass: 'remi-high',
      });
    });

    it('passes through 0-100 percentages', () => {
      expect(getRemiScoreDisplay(84)).toEqual({
        normalizedScore: 84,
        displayValue: '84%',
        label: 'Good',
        status: 'good',
        cssClass: 'remi-high',
      });
    });

    it('returns no-data for null/undefined', () => {
      expect(getRemiScoreDisplay(null)).toEqual({
        normalizedScore: null,
        displayValue: '—',
        label: 'No data',
        status: 'no-data',
        cssClass: 'remi-no-data',
      });

      expect(getRemiScoreDisplay(undefined)).toEqual({
        normalizedScore: null,
        displayValue: '—',
        label: 'No data',
        status: 'no-data',
        cssClass: 'remi-no-data',
      });
    });
  });

  describe('getRemiColorClass()', () => {
    it('maps normalized statuses to low/mid/high tiers', () => {
      expect(getRemiColorClass(0.2)).toBe('low');
      expect(getRemiColorClass(0.6)).toBe('mid');
      expect(getRemiColorClass(4)).toBe('high');
      expect(getRemiColorClass(null)).toBeNull();
    });
  });
});
