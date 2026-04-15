import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { endOfMonth, format, min, parseISO } from 'date-fns';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { MetricsFiltersService } from './metrics-filters.service';
import {
  BooleanCondition,
  DateCondition,
  DateMode,
  DateOperation,
  FilterApplyEvent,
  FilterColumnConfig,
  NumericCondition,
} from './metrics-filters.model';

@Component({
  selector: 'app-metrics-filters',
  templateUrl: './metrics-filters.component.html',
  styleUrl: './metrics-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MetricsFiltersService],
  imports: [TranslateModule, PaButtonModule, PaTextFieldModule, PaTogglesModule],
})
export class MetricsFiltersComponent {
  protected service = inject(MetricsFiltersService);

  // ── Inputs ──────────────────────────────────────────────────────────────
  showSyntheticStatus = input(false);
  syntheticStatusDisabled = input(false);
  syntheticStatuses = input<string[]>([]);
  activeSyntheticStatuses = input<Set<string>>(new Set());
  syntheticStatusLabels = input<Record<string, string>>({});
  filterColumns = input<FilterColumnConfig[]>([]);
  activeBooleanConditions = input<BooleanCondition[]>([]);
  activeNumericConditions = input<NumericCondition[]>([]);
  selectedMonth = input<string>('');
  activeDateConditions = input<DateCondition[]>([]);

  // ── Output ──────────────────────────────────────────────────────────────
  filtersApplied = output<FilterApplyEvent>();

  // ── UI state ────────────────────────────────────────────────────────────
  isOpen = signal(false);
  isExpanded = signal(false);

  // ── Delegated signals from service ──────────────────────────────────────
  conditions = this.service.conditions;
  operations = this.service.operations;

  // ── Derived (from APPLIED state, not draft) ─────────────────────────────
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.showSyntheticStatus()) {
      const all = this.syntheticStatuses().length;
      const active = this.activeSyntheticStatuses().size;
      if (active > 0 && active < all) count++;
    }
    count += this.activeBooleanConditions().length;
    count += this.activeNumericConditions().length;
    count += this.activeDateConditions().length;
    return count;
  });

  // ── Keyboard handlers ──────────────────────────────────────────────────

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) this.closeSidebar();
  }

  @HostListener('document:keydown.enter')
  onEnterKey(): void {
    if (this.isOpen()) this.applyFilters();
  }

  // ── Expand / collapse ─────────────────────────────────────────────────

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  // ── Sidebar toggle ────────────────────────────────────────────────────

  toggleSidebar(): void {
    const willOpen = !this.isOpen();
    this.isOpen.set(willOpen);
    if (willOpen) {
      this.service.initDraftFromInputs(
        this.activeSyntheticStatuses(),
        this.activeBooleanConditions(),
        this.activeNumericConditions(),
        this.activeDateConditions(),
      );
    }
  }

  closeSidebar(): void {
    this.isOpen.set(false);
    this.isExpanded.set(false);
  }

  // ── Delegate to service ───────────────────────────────────────────────

  isSyntheticStatusActive(status: string): boolean {
    return this.service.isSyntheticStatusActive(status);
  }

  onSyntheticStatusToggle(status: string, checked: boolean): void {
    this.service.onSyntheticStatusToggle(status, checked);
  }

  getSyntheticStatusLabel(status: string): string {
    return this.syntheticStatusLabels()[status] || status;
  }

  addCondition(): void {
    this.service.addCondition();
  }

  removeCondition(id: number): void {
    this.service.removeCondition(id);
  }

  updateConditionColumn(id: number, key: string): void {
    this.service.updateConditionColumn(id, key, this.filterColumns());
  }

  updateConditionOperation(id: number, op: string): void {
    this.service.updateConditionOperation(id, op);
  }

  updateConditionNumericValue(id: number, val: string): void {
    this.service.updateConditionNumericValue(id, val);
  }

  updateConditionBooleanValue(id: number, val: boolean): void {
    this.service.updateConditionBooleanValue(id, val);
  }

  updateConditionDateValue(id: number, val: string): void {
    this.service.updateConditionDateValue(id, val);
  }

  updateConditionDateTime(id: number, val: string): void {
    this.service.updateConditionDateTime(id, val);
  }

  updateConditionDateOperation(id: number, op: string): void {
    this.service.updateConditionDateOperation(id, op as DateOperation);
  }

  selectDateMode(columnKey: string, mode: DateMode): void {
    this.service.selectDateMode(columnKey, mode);
  }

  getDateMode(columnKey: string): DateMode | null {
    return this.service.getDateMode(columnKey);
  }

  getDateOperationLabelKey(op: DateOperation): string {
    const keys: Record<DateOperation, string> = {
      ge: 'activity.filter.date_op_ge',
      le: 'activity.filter.date_op_le',
      eq: 'activity.filter.date_op_eq',
    };
    return keys[op];
  }

  onDateValueChange(conditionId: number, isoValue: string | null | undefined): void {
    if (!isoValue) {
      this.updateConditionDateValue(conditionId, '');
      return;
    }
    // Slice to YYYY-MM-DD to avoid timezone-offset drift when constructing Date objects
    this.updateConditionDateValue(conditionId, isoValue.slice(0, 10));
  }

  getColumnType(key: string) {
    return this.service.getColumnType(key, this.filterColumns());
  }

  getOperationsForColumn(key: string) {
    return this.service.getOperationsForColumn(key, this.filterColumns());
  }

  readonly today = format(new Date(), 'yyyy-MM-dd');

  getMonthLastDay(): string {
    const month = this.selectedMonth();
    if (!month) return '';
    return format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd');
  }

  getMaxDate(): string {
    const month = this.selectedMonth();
    if (!month) return this.today;
    return format(min([endOfMonth(parseISO(`${month}-01`)), new Date()]), 'yyyy-MM-dd');
  }

  // ── Apply / Reset ────────────────────────────────────────────────────

  applyFilters(): void {
    const event = this.service.buildApplyEvent(this.showSyntheticStatus(), this.syntheticStatuses());
    this.filtersApplied.emit(event);
    this.closeSidebar();
  }

  resetFilters(): void {
    const event = this.service.buildResetEvent(this.showSyntheticStatus(), this.syntheticStatuses());
    this.filtersApplied.emit(event);
    this.closeSidebar();
  }
}
