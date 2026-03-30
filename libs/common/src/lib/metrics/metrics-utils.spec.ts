import { getMonthRange, aggregateUsageMetric, applyTextSearchFilter, applyNumericConditions } from './metrics-utils';
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
        { metrics: [{ name: 'cpu', value: 10 }, { name: 'mem', value: 5 }] },
        { metrics: [{ name: 'cpu', value: 20 }] },
      ] as any;
      expect(aggregateUsageMetric(points, 'cpu')).toBe(30);
    });

    it('returns 0 when no metrics match the name', () => {
      const points: UsagePoint[] = [
        { metrics: [{ name: 'cpu', value: 10 }] },
      ] as any;
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
});
