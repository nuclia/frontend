import { Injectable, signal } from '@angular/core';
import {
  BooleanCondition,
  ConditionRow,
  FilterApplyEvent,
  FilterColumnConfig,
  FilterColumnType,
  NumericCondition,
  NumericOperation,
} from './metrics-filters.model';

@Injectable()
export class MetricsFiltersService {
  private nextConditionId = 0;
  readonly draftStatuses = signal<Set<string>>(new Set());
  readonly conditions = signal<ConditionRow[]>([]);

  readonly operations: ReadonlyArray<{ value: NumericOperation; symbol: string }> = [
    { value: 'eq', symbol: '=' },
    { value: 'ne', symbol: '≠' },
    { value: 'gt', symbol: '>' },
    { value: 'ge', symbol: '≥' },
    { value: 'lt', symbol: '<' },
    { value: 'le', symbol: '≤' },
  ];

  // ── Synthetic status (draft) ─────────────────────────────────────────────

  isSyntheticStatusActive(status: string): boolean {
    return this.draftStatuses().has(status);
  }

  onSyntheticStatusToggle(status: string, checked: boolean): void {
    const current = this.draftStatuses();
    if (!checked && current.size <= 1) return;
    const next = new Set(current);
    if (checked) {
      next.add(status);
    } else {
      next.delete(status);
    }
    this.draftStatuses.set(next);
  }

  // ── Condition builder ────────────────────────────────────────────────────

  addCondition(): void {
    this.conditions.update((list) => [
      ...list,
      {
        id: this.nextConditionId++,
        column: '',
        columnType: null,
        operation: 'eq' as NumericOperation,
        numericValue: '',
        booleanValue: true,
      },
    ]);
  }

  removeCondition(id: number): void {
    this.conditions.update((list) => list.filter((c) => c.id !== id));
  }

  updateConditionColumn(id: number, columnKey: string, filterColumns: FilterColumnConfig[]): void {
    const colConfig = filterColumns.find((c) => c.key === columnKey);
    this.conditions.update((list) =>
      list.map((c) =>
        c.id === id ? { ...c, column: columnKey, columnType: colConfig?.type ?? null } : c,
      ),
    );
  }

  updateConditionOperation(id: number, op: string): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, operation: op as NumericOperation } : c)),
    );
  }

  updateConditionNumericValue(id: number, val: string): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, numericValue: val } : c)),
    );
  }

  updateConditionBooleanValue(id: number, val: boolean): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, booleanValue: val } : c)),
    );
  }

  getColumnType(columnKey: string, filterColumns: FilterColumnConfig[]): FilterColumnType | null {
    if (!columnKey) return null;
    return filterColumns.find((c) => c.key === columnKey)?.type ?? null;
  }

  getOperationsForColumn(
    columnKey: string,
    filterColumns: FilterColumnConfig[],
  ): Array<{ value: NumericOperation; symbol: string }> {
    const config = filterColumns.find((c) => c.key === columnKey);
    if (config?.allowedOperations) {
      return this.operations.filter((op) => config.allowedOperations!.includes(op.value));
    }
    return [...this.operations];
  }

  // ── Apply / Reset ────────────────────────────────────────────────────────

  buildApplyEvent(showSyntheticStatus: boolean, syntheticStatuses: string[]): FilterApplyEvent {
    const event: FilterApplyEvent = {
      booleanConditions: [],
      numericConditions: [],
    };

    if (showSyntheticStatus) {
      event.syntheticStatuses = [...this.draftStatuses()];
    }

    for (const row of this.conditions()) {
      if (!row.column || !row.columnType) continue;
      if (row.columnType === 'boolean') {
        event.booleanConditions.push({ column: row.column, value: row.booleanValue });
      } else if (row.columnType === 'numeric') {
        const numVal = Number(row.numericValue);
        if (row.numericValue !== '' && !isNaN(numVal)) {
          event.numericConditions.push({
            column: row.column,
            operation: row.operation,
            value: numVal,
          });
        }
      }
    }

    return event;
  }

  buildResetEvent(showSyntheticStatus: boolean, allStatuses: string[]): FilterApplyEvent {
    if (showSyntheticStatus) {
      this.draftStatuses.set(new Set(allStatuses));
    }
    this.conditions.set([]);

    const event: FilterApplyEvent = {
      booleanConditions: [],
      numericConditions: [],
    };
    if (showSyntheticStatus) {
      event.syntheticStatuses = [...allStatuses];
    }
    return event;
  }

  // ── Initialize draft from active inputs ──────────────────────────────────

  initDraftFromInputs(
    activeStatuses: Set<string>,
    activeBooleans: BooleanCondition[],
    activeNumerics: NumericCondition[],
  ): void {
    this.draftStatuses.set(new Set(activeStatuses));

    const rows: ConditionRow[] = [];
    for (const bc of activeBooleans) {
      rows.push({
        id: this.nextConditionId++,
        column: bc.column,
        columnType: 'boolean',
        operation: 'eq',
        numericValue: '',
        booleanValue: bc.value,
      });
    }
    for (const nc of activeNumerics) {
      rows.push({
        id: this.nextConditionId++,
        column: nc.column,
        columnType: 'numeric',
        operation: nc.operation,
        numericValue: String(nc.value),
        booleanValue: true,
      });
    }
    this.conditions.set(rows);
  }
}
