import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { ActivityLogItem, DownloadFormat } from '@nuclia/core';
import { MetricsColumnDef, MetricsMonthRange, MetricsSidebarField } from './metrics-column.model';
import { MetricsPageService } from './metrics-page.service';
import { MetricsCellPlugin, MetricsSidebarPlugin } from './metrics-cell-plugin';
import { METRICS_EMPTY_STATE, METRICS_PAGE_SIZES } from './metrics.config';

@Component({
  standalone: false,
  selector: 'app-metrics-page',
  templateUrl: './metrics-page.component.html',
  styleUrl: './metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe, MetricsPageService],
})
export class MetricsPageComponent {
  readonly service = inject(MetricsPageService);
  private destroyRef = inject(DestroyRef);
  private datePipe = inject(DatePipe);

  // ── Inputs ────────────────────────────────────────────────────────────────

  pageTitle = input('');
  pageSubtitle = input('');
  loading = input(false);
  loadingMore = input(false);
  hasMore = input(false);
  resetPagination = input(0);
  columns = input<MetricsColumnDef[]>([]);
  sidebarFields = input<MetricsSidebarField[]>([]);
  items = input<ActivityLogItem[]>([]);
  availableMonths = input<string[]>([]);
  showDownload = input(true);
  showSearch = input(true);
  hasActiveFilters = input(false);
  /** Plugin that handles domain-specific cell rendering (score displays, chips, colour classes). */
  cellPlugin = input<MetricsCellPlugin | null>(null);
  /** Plugin that decides whether/what to inject after a sidebar group. */
  sidebarPlugin = input<MetricsSidebarPlugin | null>(null);
  /**
   * Template rendered for custom columns (when `cellPlugin.isCustomColumn()` returns true).
   * Context: `{ $implicit: item: ActivityLogItem, col: MetricsColumnDef }`.
   * Mirrors the `afterGroupTemplate` pattern for sidebar extras.
   */
  customCellTemplate = input<TemplateRef<{ $implicit: ActivityLogItem; col: MetricsColumnDef }> | null>(null);
  /**
   * Optional template rendered after a sidebar group when sidebarPlugin returns true.
   * Context: `{ $implicit: pluginData, item: ActivityLogItem }`.
   */
  afterGroupTemplate = input<TemplateRef<{ $implicit: unknown; item: ActivityLogItem }> | null>(null);
  readonly rowAction = input<{
    icon: string;
    tooltip: string;
    visible: (item: ActivityLogItem) => boolean;
  } | null>(null);

  // ── Outputs ───────────────────────────────────────────────────────────────

  monthRangeChange = output<MetricsMonthRange>();
  rowClick = output<ActivityLogItem>();
  searchChange = output<{ term: string; column: string }>();
  loadNextPage = output<void>();
  downloadRequested = output<{ format: DownloadFormat }>();
  rowActionTriggered = output<ActivityLogItem>();
  resetFilters = output<void>();

  // ── Internal state ────────────────────────────────────────────────────────

  readonly selectedMonth = signal<string>(MetricsPageComponent.currentYearMonth());
  readonly selectedItem = signal<ActivityLogItem | null>(null);
  readonly sidePanelExpanded = signal(false);

  // ── Pagination ────────────────────────────────────────────────────────────

  readonly currentPage = signal(0);
  readonly currentPageSize = signal<number>(METRICS_PAGE_SIZES[1]); // default 50

  readonly emptyState = computed(() =>
    this.hasActiveFilters() ? METRICS_EMPTY_STATE.filtered : METRICS_EMPTY_STATE.noData,
  );

  readonly paginatedItems = computed(() => {
    const page = this.currentPage();
    const size = this.currentPageSize();
    return this.items().slice(page * size, (page + 1) * size);
  });

  /** Always includes the current month at the top so the user can see it even with no data. */
  readonly monthOptions = computed(() => {
    const available = this.availableMonths();
    const current = MetricsPageComponent.currentYearMonth();
    if (available.length === 0) return [current];
    if (!available.includes(current)) return [current, ...available];
    return available;
  });

  /** Search debounce — 250 ms delay before updating the filter signal. */
  private readonly searchInput$ = new Subject<string>();
  private readonly currentSearchTerm = signal<string>('');

  constructor() {
    effect(() => {
      this.service.setColumns(this.columns());
    });
    effect(() => {
      this.service.setItems(this.items());
    });
    // Reset to first page only on full data reloads (month/filter change), not on append
    effect(() => {
      this.resetPagination();
      this.currentPage.set(0);
    });

    effect(() => {
      const months = this.availableMonths();
      if (months.length > 0 && !months.includes(this.selectedMonth())) {
        this._selectMonth(months[0]);
      }
    });

    // Trigger API fetch when the current page needs items beyond what's loaded.
    // items() is read via untracked to avoid re-triggering on every append —
    // only page/pageSize changes should drive this effect.
    effect(() => {
      const needed = (this.currentPage() + 1) * this.currentPageSize();
      const loaded = untracked(() => this.items().length);
      if (needed > loaded && this.hasMore() && !this.loadingMore()) {
        this.loadNextPage.emit();
      }
    });

    this.service.updateRangeLabel(this.selectedMonth());

    this.searchInput$.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef)).subscribe((term) => {
      this.currentSearchTerm.set(term ?? '');
      this.searchChange.emit({ term: term ?? '', column: this.service.searchMode() });
    });
  }

  // ── Keyboard handlers ──────────────────────────────────────────────────────

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedItem()) {
      this.closeSidePanel();
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onMonthChange(value: string): void {
    if (value) {
      this._selectMonth(value);
    }
  }

  formatMonth(yyyyMM: string): string {
    const [year, month] = yyyyMM.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return this.datePipe.transform(d, 'MMM yyyy') ?? yyyyMM;
  }

  private _selectMonth(value: string): void {
    this.selectedMonth.set(value);
    this.service.updateRangeLabel(value);
    this.monthRangeChange.emit({ from: value, to: value });
  }

  onSearch(term: string): void {
    this.searchInput$.next(term ?? '');
  }

  onModeSelected(mode: string): void {
    this.service.updateSearchMode(mode);
    const term = this.currentSearchTerm();
    if (term) {
      this.searchChange.emit({ term, column: mode });
    }
  }

  onEmptyStateAction(): void {
    this.resetFilters.emit();
  }

  toggleColumn(key: string): void {
    this.service.toggleColumn(key);
  }

  onRowClick(item: ActivityLogItem): void {
    this.selectedItem.set(item);
    this.rowClick.emit(item);
  }

  closeSidePanel(): void {
    this.selectedItem.set(null);
    this.sidePanelExpanded.set(false);
  }

  toggleSidePanelExpand(): void {
    this.sidePanelExpanded.update((v) => !v);
  }

  /** Fields like question/answer/reasoning get the accordion inner-card treatment. */
  isLargeTextField(key: string): boolean {
    return key === 'question' || key === 'answer' || key === 'reasoning' || key === 'retrieval_rephrased_question';
  }

  /** Groups all columns + sidebar fields by their group property for sidebar rendering. */
  readonly sidebarGroups = computed(() => {
    const colFields = this.service.columnDefs().map((col) => ({
      key: col.key,
      label: col.label,
      value: col.value,
      colorFn: col.colorFn,
      iconFn: col.iconFn,
      iconColorClass: col.iconColorClass,
      group: col.group || 'query',
      expandable: this.isLargeTextField(col.key),
      isColumn: true,
    }));

    const extraFields = this.sidebarFields().map((field) => ({
      key: field.key,
      label: field.label,
      value: field.value,
      colorFn: undefined as ((item: ActivityLogItem) => 'low' | 'mid' | 'high' | null) | undefined,
      iconFn: field.iconFn,
      iconColorClass: field.iconColorClass,
      group: field.group || 'query',
      expandable: field.expandable || this.isLargeTextField(field.key),
      isColumn: false,
    }));

    const allFields = [...colFields, ...extraFields];
    const plugin = this.cellPlugin();

    const groupMap = allFields.reduce((map, field) => {
      const group = field.group;
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(field);
      return map;
    }, new Map<string, typeof allFields>());

    return Array.from(groupMap.entries()).map(([group, fields]) => ({
      group,
      labelKey: plugin?.getGroupLabelKey(group) ?? `activity.detail.group.${group}`,
      fields: plugin?.filterGroupFields(group, fields) ?? fields,
    }));
  });

  readonly computedGridColumns = computed(() => {
    const base = this.service.gridColumns();
    return this.rowAction() ? `${base} 48px` : base;
  });

  // ── Cell helpers ──────────────────────────────────────────────────────────

  /** True when the column needs custom rendering via `customCellTemplate`. */
  isCustomColumn(key: string): boolean {
    return this.cellPlugin()?.isCustomColumn(key) ?? false;
  }

  getCellValue(item: ActivityLogItem, key: string): string {
    return this.service.getCellValue(item, key);
  }

  // ── Field / sidebar helpers ───────────────────────────────────────────────

  getFieldValue(
    item: ActivityLogItem,
    field: { key: string; value: (item: ActivityLogItem) => unknown; isColumn: boolean },
  ): string {
    if (field.isColumn) {
      return this.getCellValue(item, field.key);
    }
    const raw = field.value(item);
    if (raw == null) return '—';
    if (field.key === 'date') {
      return this.datePipe.transform(raw as string, 'MMM dd, yyyy') ?? String(raw);
    }
    return String(raw);
  }

  hasGroupData(item: ActivityLogItem, fields: Array<{ value: (item: ActivityLogItem) => unknown }>): boolean {
    return fields.some((f) => f.value(item) != null);
  }

  isFieldVisible(item: ActivityLogItem, field: { value: (item: ActivityLogItem) => unknown }): boolean {
    const val = field.value(item);
    return val != null && val !== '';
  }

  isColumnVisible(key: string): boolean {
    return this.service.isColumnVisible(key);
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.currentPageSize.set(size);
    this.currentPage.set(0);
  }

  // ── Download ──────────────────────────────────────────────────────────────

  onDownload(format: DownloadFormat): void {
    this.downloadRequested.emit({ format });
  }

  private static currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
