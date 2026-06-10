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
import { getRemiScoreDisplay } from './metrics-utils';

export interface RemiDiagnosis {
  score: number | null | undefined;
  severity: 'good' | 'needs-review' | 'poor' | 'no-data';
  issueLabel?: string;
  mainIssue: string;
  why: string;
  recommendedAction: string;
}

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
  emptyStateTitleKey = input('generic.empty');
  emptyStateDescriptionKey = input('');
  emptyStateActionLabelKey = input('');
  showEmptyStateAction = input(false);
  remiDiagnosisResolver = input<((item: ActivityLogItem) => RemiDiagnosis | null) | null>(null);
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
  emptyStateActionTriggered = output<void>();

  // ── Internal state ────────────────────────────────────────────────────────

  readonly rowHeight = 56;
  viewportOffset = 0;
  private readonly remiMetricKeys = new Set(['remiScore', 'answerRelevance', 'contentRelevance', 'groundedness']);

  readonly selectedMonth = signal<string>(MetricsPageComponent.currentYearMonth());
  readonly selectedItem = signal<ActivityLogItem | null>(null);
  readonly sidePanelExpanded = signal(false);

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

  onEmptyStateAction(): void {
    this.emptyStateActionTriggered.emit();
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

    const groupMap = allFields.reduce((map, field) => {
      const group = field.group;
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(field);
      return map;
    }, new Map<string, typeof allFields>());

    return Array.from(groupMap.entries()).map(([group, fields]) => ({
      group,
      labelKey: group === 'remi' ? 'Metric Breakdown' : `activity.detail.group.${group}`,
      fields:
        group === 'remi' ? fields.filter((field) => !['status', 'remiScore', 'issue'].includes(field.key)) : fields,
    }));
  });

  readonly computedGridColumns = computed(() => {
    const base = this.service.gridColumns();
    return this.rowAction() ? `${base} 48px` : base;
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

  isRemiMetricColumn(key: string): boolean {
    return this.remiMetricKeys.has(key);
  }

  isIssueColumn(key: string): boolean {
    return key === 'issue';
  }

  getIssueLabel(item: ActivityLogItem): string {
    return ((item as ActivityLogItem & { _issueLabel?: string })._issueLabel ?? 'No data').trim();
  }

  getIssueSeverity(item: ActivityLogItem): 'good' | 'needs-review' | 'poor' | 'no-data' {
    return (item as ActivityLogItem & { _issueSeverity?: 'good' | 'needs-review' | 'poor' | 'no-data' })._issueSeverity ??
      'no-data';
  }

  getCellTooltip(item: ActivityLogItem, key: string): string {
    const remiTooltip = this.getRemiMetricTooltip(item, key);
    if (remiTooltip !== null) return remiTooltip;
    return this.getCellValue(item, key);
  }

  getCellAriaLabel(item: ActivityLogItem, key: string): string {
    const remiTooltip = this.getRemiMetricTooltip(item, key);
    if (remiTooltip !== null) return remiTooltip;
    return this.getCellValue(item, key);
  }

  getRemiMetricRawValue(item: ActivityLogItem, key: string): number | null | undefined {
    return this.getRawRemiMetricValue(item, key);
  }

  getRemiDiagnosis(item: ActivityLogItem): RemiDiagnosis | null {
    const resolver = this.remiDiagnosisResolver();
    return resolver ? resolver(item) : null;
  }

  hasRemiDiagnosis(item: ActivityLogItem): boolean {
    return this.getRemiDiagnosis(item) !== null;
  }

  shouldExpandRemiExpected(item: ActivityLogItem): boolean {
    const diagnosis = this.getRemiDiagnosis(item);
    if (!diagnosis) return false;
    if (diagnosis.issueLabel) {
      return diagnosis.issueLabel !== 'No major issue';
    }
    return diagnosis.severity !== 'good';
  }

  private getRemiMetricTooltip(item: ActivityLogItem, key: string): string | null {
    const remiRawValue = this.getRawRemiMetricValue(item, key);
    if (remiRawValue === undefined) return null;

    const display = getRemiScoreDisplay(remiRawValue);
    return display.normalizedScore === null ? display.label : `${display.displayValue} · ${display.label}`;
  }

  private getRawRemiMetricValue(item: ActivityLogItem, key: string): number | null | undefined {
    const usageItem = item as ActivityLogItem & {
      _remiScore?: number | null;
      _remiAnswerRelevance?: number | null;
      _remiContextRelevance?: number | null;
      _remiGroundedness?: number | null;
    };

    if (key === 'remiScore') return usageItem._remiScore;
    if (key === 'answerRelevance') return usageItem._remiAnswerRelevance;
    if (key === 'contentRelevance') return usageItem._remiContextRelevance;
    if (key === 'groundedness') return usageItem._remiGroundedness;
    return undefined;
  }

  isRemiScoreLow(item: ActivityLogItem, col: MetricsColumnDef): boolean {
    if (!col.colorFn) return false;
    return col.colorFn(item) === 'low';
  }

  isRemiScoreMid(item: ActivityLogItem, col: MetricsColumnDef): boolean {
    if (!col.colorFn) return false;
    return col.colorFn(item) === 'mid';
  }

  isRemiScoreHigh(item: ActivityLogItem, col: MetricsColumnDef): boolean {
    if (!col.colorFn) return false;
    return col.colorFn(item) === 'high';
  }

  // ── Download ──────────────────────────────────────────────────────────────

  onDownload(format: DownloadFormat): void {
    this.downloadRequested.emit({ format });
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
