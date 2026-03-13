import {
  ChangeDetectionStrategy,
  Component,
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
import { ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef, ActivityMonthRange } from './activity-column.model';
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
  columns = input<ActivityColumnDef[]>([]);
  items = input<ActivityLogItem[]>([]);
  availableMonths = input<string[]>([]);

  // ── Outputs ───────────────────────────────────────────────────────────────

  monthRangeChange = output<ActivityMonthRange>();
  rowClick = output<ActivityLogItem>();

  // ── Internal state ────────────────────────────────────────────────────────

  readonly rowHeight = 56;
  viewportOffset = 0;

  readonly selectedMonth = signal<string>(ActivityLogPageComponent.currentYearMonth());

  /** Search debounce — 250 ms delay before updating the filter signal. */
  private readonly searchInput$ = new Subject<string>();

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
    ).subscribe((term) => this.service.updateSearchTerm(term));
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
  }

  toggleColumn(key: string): void {
    this.service.toggleColumn(key);
  }

  isColumnVisible(key: string): boolean {
    return this.service.isColumnVisible(key);
  }

  getCellValue(item: ActivityLogItem, key: string): string {
    return this.service.getCellValue(item, key);
  }

  // ── Download ──────────────────────────────────────────────────────────────

  onDownloadCsv(): void {
    const rows = this.service.filteredRows();
    const visibleKeys = this.service.visibleColumnKeys();
    const visibleDefs = this.service.columnDefs().filter((c) => visibleKeys.includes(c.key));
    this.service.downloadBlob(
      this.service.buildCsvBlob(visibleDefs, rows),
      `activity_${this.service.today()}.csv`,
    );
  }

  onDownloadJson(): void {
    const rows = this.service.filteredRows();
    const visibleKeys = this.service.visibleColumnKeys();
    const visibleDefs = this.service.columnDefs().filter((c) => visibleKeys.includes(c.key));
    this.service.downloadBlob(
      this.service.buildJsonBlob(visibleDefs, rows),
      `activity_${this.service.today()}.json`,
    );
  }

  private static currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
