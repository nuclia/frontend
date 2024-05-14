import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, forkJoin, Observable, of, Subject, take } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { FeaturesService, SDKService, STFTrackingService } from '@flaps/core';
import { OptionModel, PopoverDirective } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { UploadService } from '../../upload/upload.service';
import { ResourceListService } from './resource-list.service';
import { Filters, formatFiltersFromFacets, MIME_FACETS } from '../resource-filters.utils';
import { Search } from '@nuclia/core';

const POPOVER_DISPLAYED = 'NUCLIA_STATUS_POPOVER_DISPLAYED';

@Component({
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements OnDestroy {
  @ViewChild('pendingPopoverDirective') pendingPopoverDirective?: PopoverDirective;
  @ViewChild('failedPopoverDirective') failedPopoverDirective?: PopoverDirective;

  private localStorage = inject(LOCAL_STORAGE);

  unsubscribeAll = new Subject<void>();

  statusCount = this.uploadService.statusCount.pipe(
    tap((count) => {
      if (this.localStorage.getItem(POPOVER_DISPLAYED) !== 'done' && (count.error > 0 || count.pending > 0)) {
        // we cannot open the two popovers at the same time, so error takes priority
        setTimeout(() => {
          const popover = count.error > 0 ? this.failedPopoverDirective : this.pendingPopoverDirective;
          popover?.toggle();
          this.localStorage.setItem(POPOVER_DISPLAYED, 'done');
          // Close after 5s if still visible
          setTimeout(() => {
            if (popover?.popupDirective.paPopup?.isDisplayed) {
              popover.toggle();
            }
          }, 5000);
        });
      }
    }),
  );

  get isMainView(): boolean {
    return !this.resourceListService.status;
  }
  get isProcessedView(): boolean {
    return this.resourceListService.status === 'PROCESSED';
  }
  get isPendingView(): boolean {
    return this.resourceListService.status === 'PENDING';
  }
  get isErrorView(): boolean {
    return this.resourceListService.status === 'ERROR';
  }

  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.features.isKbAdminOrContrib;
  query = this.resourceListService.query;

  standalone = this.sdk.nuclia.options.standalone;
  emptyKb = this.resourceListService.emptyKb;

  labelSets = this.resourceListService.labelSets;
  isFiltering = this.resourceListService.filters.pipe(map((filters) => filters.length > 0));
  showClearButton = this.resourceListService.filters.pipe(map((filters) => filters.length > 2));
  filterOptions: Filters = { classification: [], mainTypes: [] };
  hasFilters = false;

  constructor(
    private sdk: SDKService,
    private uploadService: UploadService,
    private resourceListService: ResourceListService,
    private tracking: STFTrackingService,
    private features: FeaturesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.resourceListService.updateCount().subscribe();
    this.resourceListService.isShardReady
      .pipe(
        filter((ready) => ready),
        switchMap(() => {
          if (this.isMainView || this.isProcessedView) {
            return this.loadFilters();
          } else {
            this.filterOptions = { classification: [], mainTypes: [] };
            this.hasFilters = false;
            this.cdr.markForCheck();
            return of(null);
          }
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onQueryChange(query: string) {
    this.resourceListService.setQuery(query);
    // Reset resource list when query is empty (without forcing user to hit enter)
    if (!query) {
      this.search();
    }
  }

  goToView(path: '' | 'processed' | 'pending' | 'error') {
    this.router.navigate([`./${path}`], { relativeTo: this.route });
  }

  search() {
    this.tracking.logEvent('search-in-resource-list', { searchIn: 'titles' });
    this.resourceListService.search();
  }

  onSelectFilter(option: OptionModel, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      option.selected = !option.selected;
      this.onToggleFilter();
    }
  }

  onCloseFilter(option: OptionModel) {
    option.selected = !option.selected;
    this.onToggleFilter();
  }

  onToggleFilter() {
    const filters = this.selectedFilters;
    if (filters.length > 0) {
      this.router.navigate(['./'], { relativeTo: this.route, queryParams: { filters } });
      this.resourceListService.filter(filters);
    } else {
      this.clearFilters();
    }
  }

  clearFilters() {
    this.router.navigate(['./'], { relativeTo: this.route, queryParams: {} });
    this.resourceListService.filter([]);
    this.filterOptions.classification.forEach((option) => (option.selected = false));
    this.filterOptions.mainTypes.forEach((option) => (option.selected = false));
  }

  get selectedMainTypes() {
    return this.filterOptions.mainTypes.filter((option) => option.selected);
  }

  get selectedClassifications() {
    return this.filterOptions.classification.filter((option) => option.selected);
  }

  get selectedFilters(): string[] {
    return this.getSelectionFor('classification').concat(this.getSelectionFor('mainTypes'));
  }

  private getSelectionFor(type: 'classification' | 'mainTypes') {
    return this.filterOptions[type].filter((option) => option.selected).map((option) => option.value);
  }

  private loadFilters(): Observable<void> {
    return forkJoin([
      this.sdk.currentKb.pipe(take(1)),
      this.labelSets.pipe(take(1)),
      this.route.queryParamMap.pipe(take(1)),
      this.resourceListService.prevFilters.pipe(take(1)),
    ]).pipe(
      switchMap(([kb, labelSets, queryParams, prevFilters]) => {
        const faceted = MIME_FACETS.concat(Object.keys(labelSets).map((setId) => `/l/${setId}`));
        return kb.catalog('', { faceted }).pipe(map((results) => ({ results, queryParams, prevFilters })));
      }),
      map(({ results, queryParams, prevFilters }) => {
        if (results.type !== 'error') {
          const previousFilters = queryParams.get('preserveFilters') ? prevFilters : queryParams.getAll('filters');
          this.formatFiltersFromFacets(results.fulltext?.facets || {}, previousFilters);
          if (previousFilters.length > 0) {
            this.onToggleFilter();
          }
        }
      }),
    );
  }

  private formatFiltersFromFacets(allFacets: Search.FacetsResult, queryParamsFilters: string[] = []) {
    const filters = formatFiltersFromFacets(allFacets, queryParamsFilters);
    this.filterOptions = filters;
    this.hasFilters = filters.classification.length + filters.mainTypes.length > 0;
    this.cdr.markForCheck();
  }
}
