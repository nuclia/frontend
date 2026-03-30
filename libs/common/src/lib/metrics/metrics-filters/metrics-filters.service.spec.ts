import { TestBed } from '@angular/core/testing';
import { MetricsFiltersService } from './metrics-filters.service';
import { FilterColumnConfig } from './metrics-filters.model';

const FILTER_COLUMNS: FilterColumnConfig[] = [
  { key: 'duration', labelKey: 'Duration', type: 'numeric' },
  { key: 'feedback', labelKey: 'Feedback', type: 'boolean' },
  { key: 'tokens', labelKey: 'Tokens', type: 'numeric', allowedOperations: ['gt', 'lt'] },
];

describe('MetricsFiltersService', () => {
  let service: MetricsFiltersService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MetricsFiltersService] });
    service = TestBed.inject(MetricsFiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Condition CRUD ─────────────────────────────────────────────────────────

  describe('addCondition()', () => {
    it('adds a condition row with incrementing id', () => {
      service.addCondition();
      service.addCondition();
      const rows = service.conditions();
      expect(rows).toHaveLength(2);
      expect(rows[0].id).toBe(0);
      expect(rows[1].id).toBe(1);
    });

    it('creates a condition with default values', () => {
      service.addCondition();
      const row = service.conditions()[0];
      expect(row.column).toBe('');
      expect(row.columnType).toBeNull();
      expect(row.operation).toBe('eq');
      expect(row.numericValue).toBe('');
      expect(row.booleanValue).toBe(true);
    });
  });

  describe('removeCondition()', () => {
    it('removes the condition with the given id', () => {
      service.addCondition();
      service.addCondition();
      service.removeCondition(0);
      expect(service.conditions()).toHaveLength(1);
      expect(service.conditions()[0].id).toBe(1);
    });
  });

  describe('updateConditionColumn()', () => {
    it('sets column and columnType from the matching config', () => {
      service.addCondition();
      service.updateConditionColumn(0, 'duration', FILTER_COLUMNS);
      const row = service.conditions()[0];
      expect(row.column).toBe('duration');
      expect(row.columnType).toBe('numeric');
    });
  });

  describe('updateConditionOperation()', () => {
    it('sets the operation on the given condition', () => {
      service.addCondition();
      service.updateConditionOperation(0, 'gt');
      expect(service.conditions()[0].operation).toBe('gt');
    });
  });

  describe('updateConditionNumericValue()', () => {
    it('sets the numeric value on the given condition', () => {
      service.addCondition();
      service.updateConditionNumericValue(0, '42');
      expect(service.conditions()[0].numericValue).toBe('42');
    });
  });

  describe('updateConditionBooleanValue()', () => {
    it('sets the boolean value on the given condition', () => {
      service.addCondition();
      service.updateConditionBooleanValue(0, false);
      expect(service.conditions()[0].booleanValue).toBe(false);
    });
  });

  // ── Synthetic status draft ─────────────────────────────────────────────────

  describe('onSyntheticStatusToggle()', () => {
    it('adds a status when checked is true', () => {
      service.onSyntheticStatusToggle('SUCCESS', true);
      expect(service.isSyntheticStatusActive('SUCCESS')).toBe(true);
    });

    it('removes a status when checked is false and more than one remain', () => {
      service.onSyntheticStatusToggle('SUCCESS', true);
      service.onSyntheticStatusToggle('ERROR', true);
      service.onSyntheticStatusToggle('SUCCESS', false);
      expect(service.isSyntheticStatusActive('SUCCESS')).toBe(false);
      expect(service.isSyntheticStatusActive('ERROR')).toBe(true);
    });

    it('does not remove the last remaining status', () => {
      service.onSyntheticStatusToggle('SUCCESS', true);
      service.onSyntheticStatusToggle('SUCCESS', false);
      expect(service.isSyntheticStatusActive('SUCCESS')).toBe(true);
    });
  });

  // ── getOperationsForColumn ─────────────────────────────────────────────────

  describe('getOperationsForColumn()', () => {
    it('returns all operations when column has no allowedOperations', () => {
      const ops = service.getOperationsForColumn('duration', FILTER_COLUMNS);
      expect(ops).toHaveLength(6);
    });

    it('returns only allowed operations when specified', () => {
      const ops = service.getOperationsForColumn('tokens', FILTER_COLUMNS);
      expect(ops.map((o) => o.value)).toEqual(['gt', 'lt']);
    });
  });

  // ── buildApplyEvent ────────────────────────────────────────────────────────

  describe('buildApplyEvent()', () => {
    it('includes synthetic statuses when showSyntheticStatus is true', () => {
      service.onSyntheticStatusToggle('SUCCESS', true);
      const event = service.buildApplyEvent(true, ['SUCCESS', 'ERROR']);
      expect(event.syntheticStatuses).toEqual(['SUCCESS']);
    });

    it('does not include synthetic statuses when showSyntheticStatus is false', () => {
      const event = service.buildApplyEvent(false, []);
      expect(event.syntheticStatuses).toBeUndefined();
    });

    it('collects boolean conditions from condition rows', () => {
      service.addCondition();
      service.updateConditionColumn(0, 'feedback', FILTER_COLUMNS);
      service.updateConditionBooleanValue(0, false);
      const event = service.buildApplyEvent(false, []);
      expect(event.booleanConditions).toEqual([{ column: 'feedback', value: false }]);
    });

    it('collects numeric conditions with parsed values', () => {
      service.addCondition();
      service.updateConditionColumn(0, 'duration', FILTER_COLUMNS);
      service.updateConditionOperation(0, 'gt');
      service.updateConditionNumericValue(0, '100');
      const event = service.buildApplyEvent(false, []);
      expect(event.numericConditions).toEqual([{ column: 'duration', operation: 'gt', value: 100 }]);
    });

    it('skips numeric conditions with empty value', () => {
      service.addCondition();
      service.updateConditionColumn(0, 'duration', FILTER_COLUMNS);
      const event = service.buildApplyEvent(false, []);
      expect(event.numericConditions).toEqual([]);
    });

    it('skips rows without a column set', () => {
      service.addCondition();
      const event = service.buildApplyEvent(false, []);
      expect(event.booleanConditions).toEqual([]);
      expect(event.numericConditions).toEqual([]);
    });
  });

  // ── buildResetEvent ────────────────────────────────────────────────────────

  describe('buildResetEvent()', () => {
    it('clears all conditions', () => {
      service.addCondition();
      service.addCondition();
      service.buildResetEvent(false, []);
      expect(service.conditions()).toEqual([]);
    });

    it('resets draft statuses to all statuses when showSyntheticStatus is true', () => {
      service.onSyntheticStatusToggle('SUCCESS', true);
      const event = service.buildResetEvent(true, ['SUCCESS', 'ERROR', 'NO_CONTEXT']);
      expect(event.syntheticStatuses).toEqual(['SUCCESS', 'ERROR', 'NO_CONTEXT']);
      expect(service.isSyntheticStatusActive('ERROR')).toBe(true);
    });
  });

  // ── initDraftFromInputs ────────────────────────────────────────────────────

  describe('initDraftFromInputs()', () => {
    it('populates conditions from boolean and numeric inputs', () => {
      service.initDraftFromInputs(
        new Set(['SUCCESS']),
        [{ column: 'feedback', value: true }],
        [{ column: 'duration', operation: 'gt', value: 50 }],
      );
      expect(service.conditions()).toHaveLength(2);
      expect(service.conditions()[0].columnType).toBe('boolean');
      expect(service.conditions()[1].columnType).toBe('numeric');
      expect(service.conditions()[1].numericValue).toBe('50');
    });

    it('sets draft statuses from input', () => {
      service.initDraftFromInputs(new Set(['A', 'B']), [], []);
      expect(service.isSyntheticStatusActive('A')).toBe(true);
      expect(service.isSyntheticStatusActive('B')).toBe(true);
    });
  });
});
