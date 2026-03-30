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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { ActivityLogItem, DownloadFormat } from '@nuclia/core';
import { MetricsColumnDef, MetricsMonthRange, MetricsSidebarField } from './metrics-column.model';
import { MetricsPageService } from './metrics-page.service';

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
  columns = input<MetricsColumnDef[]>([]);
  sidebarFields = input<MetricsSidebarField[]>([]);
  items = input<ActivityLogItem[]>([]);
  availableMonths = input<string[]>([]);
  showDownload = input(true);
  showSearch = input(true);

  // ── Outputs ───────────────────────────────────────────────────────────────

  monthRangeChange = output<MetricsMonthRange>();
  rowClick = output<ActivityLogItem>();
  searchChange = output<{ term: string; column: string }>();
  loadNextPage = output<void>();
  downloadRequested = output<{ format: DownloadFormat; columns: string[] }>();

  // ── Internal state ────────────────────────────────────────────────────────

  readonly rowHeight = 56;
  viewportOffset = 0;

  readonly selectedMonth = signal<string>(MetricsPageComponent.currentYearMonth());
  readonly selectedItem = signal<ActivityLogItem | null>(null);
  readonly sidePanelExpanded = signal(false);

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

    effect(() => {
      const months = this.availableMonths();
      if (months.length > 0 && !months.includes(this.selectedMonth())) {
        this._selectMonth(months[0]);
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

  /** Groups all columns + sidebar fields by their group property for sidebar rendering */
  readonly sidebarGroups = computed(() => {
    const colFields = this.service.columnDefs().map((col) => ({
      key: col.key,
      label: col.label,
      value: col.value,
      group: col.group || 'query',
      expandable: this.isLargeTextField(col.key),
      isColumn: true,
    }));

    const extraFields = this.sidebarFields().map((field) => ({
      key: field.key,
      label: field.label,
      value: field.value,
      group: field.group || 'query',
      expandable: field.expandable || this.isLargeTextField(field.key),
      isColumn: false,
    }));

    const allFields = [...colFields, ...extraFields];

    const groupMap = allFields.reduce((map, field) => {
      const group = field.group;
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(field);
      return map;
    }, new Map<string, typeof allFields>());

    return Array.from(groupMap.entries()).map(([group, fields]) => ({
      group,
      labelKey: `activity.detail.group.${group}`,
      fields,
    }));
  });

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

  getCellValue(item: ActivityLogItem, key: string): string {
    return this.service.getCellValue(item, key);
  }

  isRemiScoreLow(item: ActivityLogItem, col: MetricsColumnDef): boolean {
    const val = col.value(item);
    return typeof val === 'number' && val <= 2;
  }

  isRemiScoreHigh(item: ActivityLogItem, col: MetricsColumnDef): boolean {
    const val = col.value(item);
    return typeof val === 'number' && val >= 4;
  }

  // ── Download ──────────────────────────────────────────────────────────────

  onDownload(format: DownloadFormat): void {
    this.downloadRequested.emit({
      format,
      columns: this.service.visibleColumnKeys(),
    });
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  private readonly SCROLL_NEAR_END_THRESHOLD = 30;

  onScrolledIndexChange(firstVisible: number): void {
    const total = this.items().length;
    if (total > 0 && firstVisible + this.SCROLL_NEAR_END_THRESHOLD >= total) {
      this.loadNextPage.emit();
    }
  }

  private static currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
