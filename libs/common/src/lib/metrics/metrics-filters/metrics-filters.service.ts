import { Injectable, signal } from '@angular/core';
import {
  BooleanCondition,
  ConditionRow,
  DateCondition,
  DateMode,
  DateOperation,
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
  readonly dateColumnModes = signal<Record<string, DateMode>>({});

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
        dateValue: '',
        dateTime: '',
        dateOperation: 'ge' as DateOperation,
      },
    ]);
  }

  removeCondition(id: number): void {
    const row = this.conditions().find((c) => c.id === id);
    this.conditions.update((list) => list.filter((c) => c.id !== id));
    if (row && row.columnType === 'date' && row.column) {
      const remaining = this.conditions().filter(
        (c) => c.column === row.column && c.columnType === 'date',
      );
      if (remaining.length === 0) {
        this.dateColumnModes.update((modes) => {
          const next = { ...modes };
          delete next[row.column];
          return next;
        });
      }
    }
  }

  updateConditionColumn(id: number, columnKey: string, filterColumns: FilterColumnConfig[]): void {
    const colConfig = filterColumns.find((c) => c.key === columnKey);
    const oldRow = this.conditions().find((c) => c.id === id);
    this.conditions.update((list) =>
      list.map((c) =>
        c.id === id ? { ...c, column: columnKey, columnType: colConfig?.type ?? null } : c,
      ),
    );
    // Clear date mode for the old column if it was a date column and has no remaining rows
    if (oldRow && oldRow.columnType === 'date' && oldRow.column && oldRow.column !== columnKey) {
      const remaining = this.conditions().filter(
        (c) => c.column === oldRow.column && c.columnType === 'date',
      );
      if (remaining.length === 0) {
        this.dateColumnModes.update((modes) => {
          const next = { ...modes };
          delete next[oldRow.column];
          return next;
        });
      }
    }
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

  updateConditionDateValue(id: number, val: string): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, dateValue: val } : c)),
    );
  }

  updateConditionDateTime(id: number, val: string): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, dateTime: val } : c)),
    );
  }

  updateConditionDateOperation(id: number, op: DateOperation): void {
    this.conditions.update((list) =>
      list.map((c) => (c.id === id ? { ...c, dateOperation: op } : c)),
    );
  }

  // ── Date mode ────────────────────────────────────────────────────────────

  selectDateMode(column: string, mode: DateMode): void {
    // Remove all existing date condition rows for this column
    this.conditions.update((list) =>
      list.filter((c) => !(c.column === column && c.columnType === 'date')),
    );
    // Add a fresh row for the chosen mode
    const dateOperation: DateOperation = mode === 'date' ? 'eq' : 'ge';
    this.conditions.update((list) => [
      ...list,
      {
        id: this.nextConditionId++,
        column,
        columnType: 'date',
        operation: 'eq' as NumericOperation,
        numericValue: '',
        booleanValue: true,
        dateValue: '',
        dateTime: '',
        dateOperation,
      },
    ]);
    this.dateColumnModes.update((modes) => ({ ...modes, [column]: mode }));
  }

  getDateMode(column: string): DateMode | null {
    return this.dateColumnModes()[column] ?? null;
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
      dateConditions: [],
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
      } else if (row.columnType === 'date') {
        // date rows are grouped and processed below
      }
    }

    // Group date rows by column and build DateCondition entries
    const dateRowsByColumn = new Map<string, ConditionRow[]>();
    for (const row of this.conditions()) {
      if (!row.column || row.columnType !== 'date') continue;
      if (!dateRowsByColumn.has(row.column)) {
        dateRowsByColumn.set(row.column, []);
      }
      dateRowsByColumn.get(row.column)!.push(row);
    }
    for (const [column, rows] of dateRowsByColumn) {
      const eqRows = rows.filter((r) => r.dateOperation === 'eq' && r.dateValue);
      if (eqRows.length > 0) {
        const dateValue = eqRows[0].dateValue;
        event.dateConditions.push({
          column,
          from: `${dateValue} 00:00:00.000000`,
          to: `${dateValue} 23:59:59.999999`,
        });
      } else {
        const geRows = rows.filter((r) => r.dateOperation === 'ge' && r.dateValue);
        const leRows = rows.filter((r) => r.dateOperation === 'le' && r.dateValue);
        if (geRows.length === 0 && leRows.length === 0) continue;
        const buildDateTime = (r: ConditionRow): string => {
          const time = r.dateTime || (r.dateOperation === 'ge' ? '00:00' : '23:59');
          const seconds = r.dateOperation === 'le' ? '59' : '00';
          return `${r.dateValue} ${time}:${seconds}.000000`;
        };
        const dateCondition: DateCondition = { column };
        if (geRows.length > 0) {
          const sorted = geRows.map(buildDateTime).sort();
          dateCondition.from = sorted[sorted.length - 1];
        }
        if (leRows.length > 0) {
          const sorted = leRows.map(buildDateTime).sort();
          dateCondition.to = sorted[0];
        }
        event.dateConditions.push(dateCondition);
      }
    }

    return event;
  }

  buildResetEvent(showSyntheticStatus: boolean, allStatuses: string[]): FilterApplyEvent {
    if (showSyntheticStatus) {
      this.draftStatuses.set(new Set(allStatuses));
    }
    this.conditions.set([]);
    this.dateColumnModes.set({});

    const event: FilterApplyEvent = {
      booleanConditions: [],
      numericConditions: [],
      dateConditions: [],
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
    activeDateConditions: DateCondition[] = [],
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
        dateValue: '',
        dateTime: '',
        dateOperation: 'ge',
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
        dateValue: '',
        dateTime: '',
        dateOperation: 'ge',
      });
    }
    for (const dc of activeDateConditions) {
      const isFullDay =
        dc.from &&
        dc.to &&
        dc.from.endsWith(' 00:00:00.000000') &&
        dc.to.endsWith(' 23:59:59.999999') &&
        dc.from.substring(0, 10) === dc.to.substring(0, 10);

      if (isFullDay) {
        rows.push({
          id: this.nextConditionId++,
          column: dc.column,
          columnType: 'date',
          operation: 'eq',
          numericValue: '',
          booleanValue: true,
          dateValue: dc.from!.substring(0, 10),
          dateTime: '',
          dateOperation: 'eq',
        });
      } else {
        if (dc.from) {
          const [datePart, timePart] = dc.from.split(' ');
          rows.push({
            id: this.nextConditionId++,
            column: dc.column,
            columnType: 'date',
            operation: 'eq',
            numericValue: '',
            booleanValue: true,
            dateValue: datePart,
            dateTime: timePart ? timePart.substring(0, 5) : '00:00',
            dateOperation: 'ge',
          });
        }
        if (dc.to) {
          const [datePart, timePart] = dc.to.split(' ');
          rows.push({
            id: this.nextConditionId++,
            column: dc.column,
            columnType: 'date',
            operation: 'eq',
            numericValue: '',
            booleanValue: true,
            dateValue: datePart,
            dateTime: timePart ? timePart.substring(0, 5) : '23:59',
            dateOperation: 'le',
          });
        }
      }
    }
    this.conditions.set(rows);

    // Restore date column modes from the restored conditions
    const restoredModes: Record<string, DateMode> = {};
    for (const dc of activeDateConditions) {
      const isFullDay =
        dc.from &&
        dc.to &&
        dc.from.endsWith(' 00:00:00.000000') &&
        dc.to.endsWith(' 23:59:59.999999') &&
        dc.from.substring(0, 10) === dc.to.substring(0, 10);
      restoredModes[dc.column] = isFullDay ? 'date' : 'range';
    }
    this.dateColumnModes.set(restoredModes);
  }
}
