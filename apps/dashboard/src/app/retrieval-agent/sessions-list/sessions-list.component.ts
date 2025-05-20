import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  ColumnHeader,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORTING,
  Filters,
  getFilterFromDate,
  getFilterFromVisibility,
  PAGE_SIZES,
  ResourceListParams,
  searchResources,
  TablePaginationComponent,
} from '@flaps/common';
import { SDKService } from '@flaps/core';
import {
  DropdownComponent,
  HeaderCell,
  PaButtonModule,
  PaDatePickerModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Session, SortField, SortOption } from '@nuclia/core';
import {
  DropdownButtonComponent,
  InfoCardComponent,
  StandaloneMimeIconPipe,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { endOfDay } from 'date-fns';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';

@Component({
  selector: 'app-sessions-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InfoCardComponent,
    PaButtonModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaPopupModule,
    PaDatePickerModule,
    PaTableModule,
    DropdownButtonComponent,
    PaIconModule,
    StandaloneMimeIconPipe,
    TablePaginationComponent,
    StickyFooterComponent,
    RouterLink,
  ],
  templateUrl: './sessions-list.component.html',
  styleUrls: ['./sessions-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsListComponent implements AfterViewInit, OnInit {
  private sdk = inject(SDKService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('tableContainer') tableContainer?: ElementRef;
  @ViewChild('dateFilters') dateDropdown?: DropdownComponent;

  searchControl = new FormControl('', { nonNullable: true });

  sessions = signal<Session[] | null>(null);
  loading = computed(() => this.sessions() === null);
  noSessions = computed(() => !this.loading() && this.sessions()?.length === 0);
  query = signal('');
  pagination = signal<{ page: number; total: number; pageSize: number; sort: SortOption }>({
    page: 0,
    total: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORTING,
  });
  filters = signal<string[]>([]);
  page = computed(() => this.pagination().page);
  pageSize = computed(() => this.pagination().pageSize);
  sort = computed(() => this.pagination().sort);
  totalItems = computed(() => this.pagination().total);
  totalPages = computed(() => {
    const { total, pageSize } = this.pagination();
    return Math.ceil(total / pageSize);
  });
  pageSizes = PAGE_SIZES;
  tableTopPosition = signal('0px');

  filterOptions: Filters = { classification: [], mainTypes: [], creation: {}, hidden: undefined };
  dateForm = new FormGroup({
    start: new FormControl<string>(''),
    end: new FormControl<string>(''),
  });
  initialColumns: ColumnHeader[] = [
    { id: 'title', label: 'generic.title', size: 'auto', sortable: false },
    {
      id: 'created',
      label: 'generic.date',
      size: '128px',
      sortable: true,
    },
    { id: 'menu', label: 'generic.actions', size: '96px' },
  ];
  headerCells: HeaderCell[] = this.initialColumns.map((cell) => new HeaderCell(cell));
  tableLayout = this.initialColumns.map((cell) => cell.size).join(' ');
  get selectedDates() {
    const start = this.filterOptions.creation?.start ? [this.filterOptions.creation.start.filter] : [];
    const end = this.filterOptions.creation?.end ? [this.filterOptions.creation.end.filter] : [];
    return start.concat(end);
  }
  get selectedFilters(): string[] {
    return this.getSelectionFor('classification')
      .concat(this.getSelectionFor('mainTypes'))
      .concat(this.selectedDates)
      .concat(this.selectedVisibility);
  }
  get selectedVisibility() {
    return this.filterOptions.hidden !== undefined ? getFilterFromVisibility(this.filterOptions.hidden) : [];
  }

  ngAfterViewInit(): void {
    if (this.tableContainer) {
      this.tableTopPosition.set(`${this.tableContainer.nativeElement.getBoundingClientRect().top}px`);
    }
  }
  ngOnInit(): void {
    this.triggerSearch();
  }

  triggerSearch() {
    this.query.set(this.searchControl.getRawValue());
    this.loadSessionsFromCatalog().subscribe();
  }

  private getSelectionFor(type: 'classification' | 'mainTypes') {
    return this.filterOptions[type].filter((option) => option.selected).map((option) => option.value);
  }

  private loadSessionsFromCatalog(): Observable<Session[]> {
    const listParams: ResourceListParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      sort: this.sort(),
      query: this.query(),
      filters: this.filters(),
    };
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => searchResources(arag, listParams)),
      map(({ results, kbId }) => {
        this.pagination.update((pagination) => ({ ...pagination, total: results.fulltext?.total || 0 }));
        return Object.values(results.resources || {}).map(
          (sessionData) => new Session(this.sdk.nuclia, kbId, sessionData),
        );
      }),
      tap((sessions) => this.sessions.set(sessions)),
      catchError((error) => {
        console.error(`Error while loading the session list`, error);
        return of();
      }),
    );
  }

  applyDates() {
    this.dateDropdown?.close();
    const start = this.dateForm.value.start;
    const end = this.dateForm.value.end ? endOfDay(new Date(this.dateForm.value.end)).toISOString() : undefined;
    this.filterOptions.creation = {
      start: start ? { filter: getFilterFromDate(start, 'start'), date: start } : undefined,
      end: end ? { filter: getFilterFromDate(end, 'end'), date: end } : undefined,
    };
    this.onToggleFilter();
  }

  onToggleFilter() {
    const filters = this.selectedFilters;
    if (filters.length > 0) {
      const queryParams: Params = { filters };
      this.router.navigate(['./'], { relativeTo: this.route, queryParams });
      this.pagination.update((pagination) => ({ ...pagination, page: 0 }));
      this.filters.set(filters);
    } else {
      this.clearFilters();
    }
    this.triggerSearch();
  }
  clearFilters() {
    this.router.navigate(['./'], { relativeTo: this.route, queryParams: {} });
    this.filterOptions.classification.forEach((option) => (option.selected = false));
    this.filterOptions.mainTypes.forEach((option) => (option.selected = false));
    this.filterOptions.hidden = undefined;
    this.filters.set([]);
  }

  sortBy(cell: HeaderCell) {
    switch (cell.id) {
      case SortField.title:
      case SortField.created:
      case SortField.modified:
        const sorting: SortOption = {
          field: cell.id,
          order: cell.descending ? 'desc' : 'asc',
        };
        this.pagination.update((pagination) => ({ ...pagination, page: 0, sort: sorting }));
        break;
    }
    this.triggerSearch();
  }

  loadPage(page: number) {
    this.pagination.update((pagination) => ({ ...pagination, page }));
    this.triggerSearch();
  }
  onPageSizeChange(pageSize: number) {
    this.pagination.update((pagination) => ({ ...pagination, pageSize }));
    this.triggerSearch();
  }

  onClickLink($event: MouseEvent) {
    $event.stopPropagation();
  }
  deleteSession(session: Session) {
    // TODO: delete session
    console.debug(`TODO: Delete session`, session);
  }
}
