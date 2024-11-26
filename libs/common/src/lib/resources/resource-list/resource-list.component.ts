import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { distinctUntilChanged, filter, forkJoin, merge, Observable, of, Subject, take } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { FeaturesService, SDKService, STFTrackingService } from '@flaps/core';
import { DropdownComponent, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { UploadService } from '../../upload/upload.service';
import { ResourceListService } from './resource-list.service';
import {
  Filters,
  formatFiltersFromFacets,
  getFilterFromDate,
  getFilterFromVisibility,
  MAX_FACETS_PER_REQUEST,
  MIME_FACETS,
} from '../resource-filters.utils';
import { Classification, getFilterFromLabel, getLabelFromFilter, LabelSets, Search } from '@nuclia/core';

@Component({
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements OnDestroy {
  @ViewChild('dateFilters') dateDropdown?: DropdownComponent;
  @ViewChild('header') header?: ElementRef;

  unsubscribeAll = new Subject<void>();

  statusCount = this.uploadService.statusCount;
  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.features.isKbAdminOrContrib;
  query = this.resourceListService.query;
  standalone = this.sdk.nuclia.options.standalone;
  emptyKb = this.resourceListService.totalKbResources.pipe(map((total) => total === 0));
  ready = this.resourceListService.ready;
  isShardReady = this.resourceListService.isShardReady;
  hiddenResourcesEnabled = this.resourceListService.hiddenResourcesEnabled;

  labelSets = this.resourceListService.labelSets;
  isFiltering = this.resourceListService.filters.pipe(map((filters) => filters.length > 0));
  showClearButton = this.resourceListService.filters.pipe(map((filters) => filters.length > 2));
  filterOptions: Filters = { classification: [], mainTypes: [], creation: {}, hidden: undefined };
  displayedLabelSets: LabelSets = {};

  dateForm = new FormGroup({
    start: new FormControl<string>(''),
    end: new FormControl<string>(''),
  });

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
    this.uploadService.updateStatusCount().subscribe(() => {
      // updateStatusCount is launching the first `/catalog` request which will set the shard.
      // we need to wait for it to be done before launching other request to prevent using different shards for different requests
      this.isShardReady.next(true);
    });
    this.uploadService.refreshNeeded
      .pipe(
        switchMap(() => this.resourceListService.loadResources(true, false)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();

    this.ready
      .pipe(
        distinctUntilChanged(),
        filter((ready) => ready),
        switchMap(() => {
          if (this.isMainView || this.isProcessedView) {
            return this.loadFilters();
          } else {
            this.filterOptions = { classification: [], mainTypes: [], creation: {}, hidden: undefined };
            this.cdr.markForCheck();
            return of(null);
          }
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();

    merge(this.resourceListService.ready, this.resourceListService.filters, this.uploadService.statusCount)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.resourceListService.setHeaderHeight(this.header?.nativeElement.clientHeight || 0);
      });
  }

  ngOnDestroy() {
    this.isShardReady.next(false);
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

  updateClassifications(selection: Classification[]) {
    const filters = selection.map((label) => getFilterFromLabel(label));
    this.filterOptions.classification.forEach((option) => {
      option.selected = filters.includes(option.id);
    });
    this.cdr.markForCheck();
    this.onToggleFilter();
  }

  applyDates() {
    this.dateDropdown?.close();
    const start = this.dateForm.value.start;
    const end = this.dateForm.value.end ? `${this.dateForm.value.end.slice(0, 10)}T23:59:59.000Z` : undefined;
    this.filterOptions.creation = {
      start: start ? { filter: getFilterFromDate(start, 'start'), date: start } : undefined,
      end: end ? { filter: getFilterFromDate(end, 'end'), date: end } : undefined,
    };
    this.onToggleFilter();
  }

  clearDate(type: 'start' | 'end') {
    this.dateForm.controls[type].setValue('');
    this.filterOptions.creation[type] = undefined;
    this.onToggleFilter();
  }

  onHiddenChange(hidden: boolean) {
    this.filterOptions.hidden = this.filterOptions.hidden === hidden ? undefined : hidden;
    this.onToggleFilter();
  }

  clearHidden() {
    this.filterOptions.hidden = undefined;
    this.onToggleFilter();
  }

  clearFilter(option: OptionModel) {
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
    this.filterOptions.hidden = undefined;
  }

  get selectedMainTypeOptions() {
    return this.filterOptions.mainTypes.filter((option) => option.selected);
  }

  get selectedClassificationOptions() {
    return this.filterOptions.classification.filter((option) => option.selected);
  }

  get selectedClassifications() {
    return this.selectedClassificationOptions.map((option) => getLabelFromFilter(option.id));
  }

  get selectedVisibility() {
    return this.filterOptions.hidden !== undefined ? getFilterFromVisibility(this.filterOptions.hidden) : [];
  }

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

  private getSelectionFor(type: 'classification' | 'mainTypes') {
    return this.filterOptions[type].filter((option) => option.selected).map((option) => option.value);
  }

  private loadFilters(): Observable<void> {
    return forkJoin([
      this.labelSets.pipe(take(1)),
      this.route.queryParamMap.pipe(take(1)),
      this.resourceListService.prevFilters.pipe(take(1)),
    ]).pipe(
      switchMap(([labelSets, queryParams, prevFilters]) => {
        const faceted = MIME_FACETS.concat(Object.keys(labelSets).map((setId) => `/l/${setId}`));
        return this.getFacets(faceted).pipe(map((facets) => ({ facets, labelSets, queryParams, prevFilters })));
      }),
      map(({ facets, labelSets, queryParams, prevFilters }) => {
        const previousFilters = queryParams.get('preserveFilters') ? prevFilters : queryParams.getAll('filters');
        this.formatFiltersFromFacets(facets, labelSets, previousFilters);
        if (previousFilters.length > 0) {
          this.onToggleFilter();
        }
      }),
    );
  }

  private getFacets(facets: string[]) {
    // catalog endpoint has a limit on the number of facets that can be retrieved per request
    const facetChunks = facets.reduce(
      (chunks, curr) => {
        const lastChunk = chunks[chunks.length - 1];
        lastChunk.length < MAX_FACETS_PER_REQUEST ? lastChunk.push(curr) : chunks.push([curr]);
        return chunks;
      },
      [[]] as string[][],
    );
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          facetChunks.map((faceted) => {
            return kb.catalog('', {
              faceted,
              page_size: 0, // Search results are excluded to improve performance
            });
          }),
        ),
      ),
      map((results) =>
        results
          .filter((result) => result.type !== 'error')
          .reduce((acc, curr) => ({ ...acc, ...(curr.fulltext?.facets || {}) }), {}),
      ),
    );
  }

  private formatFiltersFromFacets(
    allFacets: Search.FacetsResult,
    labelSets: LabelSets,
    queryParamsFilters: string[] = [],
  ) {
    const filters = formatFiltersFromFacets(allFacets, queryParamsFilters);
    this.filterOptions = filters;
    this.dateForm.patchValue({
      start: filters.creation?.start?.date,
      end: filters.creation?.end?.date,
    });
    this.setDisplayedLabelSets(labelSets);
  }

  private setDisplayedLabelSets(labelSets: LabelSets) {
    const filters = this.filterOptions.classification.map((option) => option.id);
    this.displayedLabelSets = Object.entries(labelSets)
      .map(([key, value]) => {
        const labelSet = {
          ...value,
          labels: value.labels.filter((label) =>
            filters.includes(getFilterFromLabel({ labelset: key, label: label.title })),
          ),
        };
        return { key, labelSet };
      })
      .filter(({ labelSet }) => labelSet.labels.length > 0)
      .reduce((acc, { key, labelSet }) => {
        acc[key] = labelSet;
        return acc;
      }, {} as LabelSets);
    this.cdr.markForCheck();
  }
}
