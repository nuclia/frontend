import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { ActivityLogItem, DownloadFormat } from '@nuclia/core';
import { ActivityColumnDef, ActivityMonthRange, ActivitySidebarField } from './activity-column.model';
import { ActivityLogPageService } from './activity-log-page.service';

@Component({
  standalone: false,
  selector: 'app-activity-log-page',
  templateUrl: './activity-log-page.component.html',
  styleUrl: './activity-log-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe, ActivityLogPageService],
})
export class ActivityLogPageComponent {
  readonly service = inject(ActivityLogPageService);
  private destroyRef = inject(DestroyRef);
  private datePipe = inject(DatePipe);

  // ── Inputs ────────────────────────────────────────────────────────────────

  pageTitle = input('');
  pageSubtitle = input('');
  loading = input(false);
  loadingMore = input(false);
  columns = input<ActivityColumnDef[]>([]);
  sidebarFields = input<ActivitySidebarField[]>([]);
  items = input<ActivityLogItem[]>([]);
  availableMonths = input<string[]>([]);
  showDownload = input(true);

  // ── Outputs ───────────────────────────────────────────────────────────────

  monthRangeChange = output<ActivityMonthRange>();
  rowClick = output<ActivityLogItem>();
  searchChange = output<{ term: string; column: string }>();
  loadNextPage = output<void>();
  downloadRequested = output<{ format: DownloadFormat; columns: string[] }>();

  // ── Internal state ────────────────────────────────────────────────────────

  readonly rowHeight = 56;
  viewportOffset = 0;

  readonly selectedMonth = signal<string>(ActivityLogPageComponent.currentYearMonth());
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

    this.searchInput$.pipe(
      debounceTime(250),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((term) => {
      this.currentSearchTerm.set(term ?? '');
      this.searchChange.emit({ term: term ?? '', column: this.service.searchMode() });
    });
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
    const allFields: Array<{ key: string; label: string; value: (item: ActivityLogItem) => any; group: string; expandable?: boolean; isColumn: boolean }> = [];

    // Add columns
    for (const col of this.service.columnDefs()) {
      allFields.push({
        key: col.key,
        label: col.label,
        value: col.value,
        group: col.group || 'query',
        expandable: this.isLargeTextField(col.key),
        isColumn: true,
      });
    }

    // Add sidebar-only fields
    for (const field of this.sidebarFields()) {
      allFields.push({
        key: field.key,
        label: field.label,
        value: field.value,
        group: field.group || 'query',
        expandable: field.expandable || this.isLargeTextField(field.key),
        isColumn: false,
      });
    }

    // Group by group name, preserving insertion order
    const groups = new Map<string, typeof allFields>();
    for (const field of allFields) {
      const existing = groups.get(field.group) || [];
      existing.push(field);
      groups.set(field.group, existing);
    }

    return Array.from(groups.entries()).map(([group, fields]) => ({
      group,
      labelKey: `activity.detail.group.${group}`,
      fields,
    }));
  });

  getFieldValue(item: ActivityLogItem, field: { key: string; value: (item: ActivityLogItem) => any; isColumn: boolean }): string {
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

  hasGroupData(item: ActivityLogItem, fields: Array<{ value: (item: ActivityLogItem) => any }>): boolean {
    return fields.some((f) => f.value(item) != null);
  }

  isColumnVisible(key: string): boolean {
    return this.service.isColumnVisible(key);
  }

  getCellValue(item: ActivityLogItem, key: string): string {
    return this.service.getCellValue(item, key);
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
