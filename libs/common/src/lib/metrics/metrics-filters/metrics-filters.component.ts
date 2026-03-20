import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

export type FilterColumnType = 'numeric' | 'boolean';

export interface FilterColumnConfig {
  key: string;
  labelKey: string;
  type: FilterColumnType;
  allowedOperations?: NumericOperation[];
}

export type NumericOperation = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';

export interface NumericCondition {
  column: string;
  operation: NumericOperation;
  value: number;
}

export interface BooleanCondition {
  column: string;
  value: boolean;
}

export interface FilterApplyEvent {
  syntheticStatuses?: string[];
  booleanConditions: BooleanCondition[];
  numericConditions: NumericCondition[];
}

interface ConditionRow {
  id: number;
  column: string;
  columnType: FilterColumnType | null;
  operation: NumericOperation;
  numericValue: string;
  booleanValue: boolean;
}

@Component({
  selector: 'app-metrics-filters',
  templateUrl: './metrics-filters.component.html',
  styleUrl: './metrics-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
  ],
})
export class MetricsFiltersComponent {
  // ── Synthetic status filter ──────────────────────────────────────────────
  showSyntheticStatus = input(false);
  syntheticStatusDisabled = input(false);
  syntheticStatuses = input<string[]>([]);
  activeSyntheticStatuses = input<Set<string>>(new Set());
  syntheticStatusLabels = input<Record<string, string>>({});

  // ── Unified filter columns ───────────────────────────────────────────────
  filterColumns = input<FilterColumnConfig[]>([]);
  activeBooleanConditions = input<BooleanCondition[]>([]);
  activeNumericConditions = input<NumericCondition[]>([]);

  // ── Outputs ──────────────────────────────────────────────────────────────
  filtersApplied = output<FilterApplyEvent>();

  // ── Internal draft state ─────────────────────────────────────────────────
  isOpen = signal(false);
  private nextConditionId = 0;
  private _draftStatuses = signal<Set<string>>(new Set());
  conditions = signal<ConditionRow[]>([]);

  readonly operations: Array<{ value: NumericOperation; symbol: string }> = [
    { value: 'eq', symbol: '=' },
    { value: 'ne', symbol: '≠' },
    { value: 'gt', symbol: '>' },
    { value: 'ge', symbol: '≥' },
    { value: 'lt', symbol: '<' },
    { value: 'le', symbol: '≤' },
  ];

  // ── Derived (from APPLIED state, not draft) ──────────────────────────────
  activeFilterCount = computed(() => {
    let count = 0;

    if (this.showSyntheticStatus()) {
      const all = this.syntheticStatuses().length;
      const active = this.activeSyntheticStatuses().size;
      if (active > 0 && active < all) count++;
    }

    count += this.activeBooleanConditions().length;
    count += this.activeNumericConditions().length;

    return count;
  });

  // ── Expand / collapse ─────────────────────────────────────────────────────
  isExpanded = signal(false);

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  // ── Sidebar toggle ───────────────────────────────────────────────────────

  toggleSidebar(): void {
    const willOpen = !this.isOpen();
    this.isOpen.set(willOpen);
    if (willOpen) {
      this._initDraftFromInputs();
    }
  }

  closeSidebar(): void {
    this.isOpen.set(false);
    this.isExpanded.set(false);
  }

  // ── Synthetic status (draft) ─────────────────────────────────────────────

  isSyntheticStatusActive(status: string): boolean {
    return this._draftStatuses().has(status);
  }

  onSyntheticStatusToggle(status: string, checked: boolean): void {
    const current = this._draftStatuses();
    if (!checked && current.size <= 1) return;
    const next = new Set(current);
    if (checked) {
      next.add(status);
    } else {
      next.delete(status);
    }
    this._draftStatuses.set(next);
  }

  getSyntheticStatusLabel(status: string): string {
    return this.syntheticStatusLabels()[status] || status;
  }

  // ── Condition builder ────────────────────────────────────────────────────

  addCondition(): void {
    this.conditions.update((list) => [
      ...list,
      { id: this.nextConditionId++, column: '', columnType: null, operation: 'eq' as NumericOperation, numericValue: '', booleanValue: true },
    ]);
  }

  removeCondition(id: number): void {
    this.conditions.update((list) => list.filter((c) => c.id !== id));
  }

  updateConditionColumn(id: number, columnKey: string): void {
    const colConfig = this.filterColumns().find((c) => c.key === columnKey);
    this.conditions.update((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, column: columnKey, columnType: colConfig?.type ?? null }
          : c,
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

  getColumnType(columnKey: string): FilterColumnType | null {
    if (!columnKey) return null;
    return this.filterColumns().find((c) => c.key === columnKey)?.type ?? null;
  }

  getOperationsForColumn(columnKey: string): Array<{ value: NumericOperation; symbol: string }> {
    const config = this.filterColumns().find((c) => c.key === columnKey);
    if (config?.allowedOperations) {
      return this.operations.filter((op) => config.allowedOperations!.includes(op.value));
    }
    return this.operations;
  }

  // ── Apply / Reset ────────────────────────────────────────────────────────

  applyFilters(): void {
    const event: FilterApplyEvent = {
      booleanConditions: [],
      numericConditions: [],
    };

    if (this.showSyntheticStatus()) {
      event.syntheticStatuses = [...this._draftStatuses()];
    }

    for (const row of this.conditions()) {
      if (!row.column || !row.columnType) continue;
      if (row.columnType === 'boolean') {
        event.booleanConditions.push({ column: row.column, value: row.booleanValue });
      } else if (row.columnType === 'numeric') {
        const numVal = Number(row.numericValue);
        if (row.numericValue !== '' && !isNaN(numVal)) {
          event.numericConditions.push({ column: row.column, operation: row.operation, value: numVal });
        }
      }
    }

    this.filtersApplied.emit(event);
    this.closeSidebar();
  }

  resetFilters(): void {
    if (this.showSyntheticStatus()) {
      this._draftStatuses.set(new Set(this.syntheticStatuses()));
    }
    this.conditions.set([]);

    const event: FilterApplyEvent = {
      booleanConditions: [],
      numericConditions: [],
    };
    if (this.showSyntheticStatus()) {
      event.syntheticStatuses = [...this.syntheticStatuses()];
    }
    this.filtersApplied.emit(event);
    this.closeSidebar();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _initDraftFromInputs(): void {
    this._draftStatuses.set(new Set(this.activeSyntheticStatuses()));

    const rows: ConditionRow[] = [];
    for (const bc of this.activeBooleanConditions()) {
      rows.push({
        id: this.nextConditionId++,
        column: bc.column,
        columnType: 'boolean',
        operation: 'eq',
        numericValue: '',
        booleanValue: bc.value,
      });
    }
    for (const nc of this.activeNumericConditions()) {
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
