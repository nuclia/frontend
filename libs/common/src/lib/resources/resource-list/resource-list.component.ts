import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import { ControlModel, DropdownComponent, OptionModel } from '@guillotinaweb/pastanaga-angular';
import {
  Classification,
  getFilterFromDate,
  getFilterFromLabel,
  getFilterFromVisibility,
  getLabelFromFilter,
  LabelSets,
  MIME_FACETS,
  RESOURCE_STATUS,
  Search,
  trimLabelSets,
} from '@nuclia/core';
import { endOfDay } from 'date-fns';
import { distinctUntilChanged, filter, forkJoin, merge, Observable, of, Subject, take } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { UploadService } from '../../upload/upload.service';
import { Filters, formatFiltersFromFacets } from '../resource-filters.utils';
import { ResourceListService } from './resource-list.service';
import { SearchModes } from './resource-list.model';

@Component({
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
  hiddenResourcesEnabled = this.resourceListService.hiddenResourcesEnabled;

  labelSets = this.resourceListService.labelSets;
  isFiltering = this.resourceListService.filters.pipe(map((filters) => filters.length > 0));
  showClearButton = this.resourceListService.filters.pipe(map((filters) => filters.length > 2));
  status = this.route.params.pipe(map((params) => this.getStatusFromParam(params['status'] || '')));
  filterOptions: Filters = { classification: [], mainTypes: [], creation: {}, hidden: undefined };
  andLogicForLabels: boolean = false;
  displayedLabelSets: LabelSets = {};
  searchModes = [
    new ControlModel({ id: 'title', value: 'title', label: 'stash.search-modes.title' }),
    new ControlModel({ id: 'startswith', value: 'startswith', label: 'stash.search-modes.startswith' }),
    new ControlModel({ id: 'uid', value: 'uid', label: 'stash.search-modes.uid' }),
    new ControlModel({ id: 'slug', value: 'slug', label: 'stash.search-modes.slug' }),
  ];
  searchMode: SearchModes = 'title';

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
    private features: FeaturesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.status.pipe(distinctUntilChanged(), takeUntil(this.unsubscribeAll)).subscribe((status) => {
      this.resourceListService.clear();
      this.resourceListService.setStatus(status);
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
    this.router.navigate([`../${path}`], { relativeTo: this.route });
  }

  search() {
    this.resourceListService.search();
  }

  onSelectFilter(option: OptionModel, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      option.selected = !option.selected;
      this.onToggleFilter();
    }
  }

  updateClassifications(selection: Classification[]) {
    const filters = selection.map((label) => getFilterFromLabel(label).toLocaleLowerCase());
    this.filterOptions.classification.forEach((option) => {
      option.selected = filters.includes(option.id.toLocaleLowerCase());
    });
    this.cdr.markForCheck();
    this.onToggleFilter();
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

  updateLabelsLogic(value: boolean) {
    this.andLogicForLabels = value;
    this.onToggleFilter();
  }

  clearFilter(option: OptionModel) {
    option.selected = !option.selected;
    this.onToggleFilter();
  }

  onToggleFilter() {
    const filters = this.selectedFilters;
    if (filters.length > 0) {
      const queryParams: Params = { filters };
      if (this.andLogicForLabels) {
        queryParams['labelsLogic'] = 'AND';
      }
      this.router.navigate(['./'], { relativeTo: this.route, queryParams });
      this.resourceListService.filter(filters, this.andLogicForLabels ? 'AND' : 'OR');
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
      this.resourceListService.prevLabelsLogic.pipe(take(1)),
    ]).pipe(
      switchMap(([labelSets, queryParams, prevFilters, prevLabelsLogic]) => {
        const faceted = MIME_FACETS.concat(Object.keys(labelSets).map((setId) => `/l/${setId}`));
        return this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            kb
              .getFacets(faceted)
              .pipe(map((facets) => ({ facets, labelSets, queryParams, prevFilters, prevLabelsLogic }))),
          ),
        );
      }),
      map(({ facets, labelSets, queryParams, prevFilters, prevLabelsLogic }) => {
        const previousFilters = queryParams.get('preserveFilters') ? prevFilters : queryParams.getAll('filters');
        this.andLogicForLabels = queryParams.get('preserveFilters')
          ? prevLabelsLogic === 'AND'
          : queryParams.get('labelsLogic') === 'AND';
        this.formatFiltersFromFacets(facets, labelSets, previousFilters);
        if (previousFilters.length > 0) {
          this.onToggleFilter();
        }
      }),
    );
  }

  private formatFiltersFromFacets(
    allFacets: Search.FacetsResult,
    labelSets: LabelSets,
    queryParamsFilters: string[] = [],
  ) {
    const filters = formatFiltersFromFacets(allFacets, queryParamsFilters);
    // some old labelsets might be lowercase while the actual ones on resources are not
    // this fix make them visible
    const nonFacetedLabels = Object.values(labelSets).reduce((all, labelSet) => {
      labelSet.labels.forEach((label) => {
        const filter = getFilterFromLabel({ labelset: labelSet.title, label: label.title });
        if (!filters.classification.some((v) => v.id === filter)) {
          // we cannot give the counting because the value differs by its case
          all.push(new OptionModel({ id: filter, label: `${labelSet.title}/${label.title} (?)`, value: filter }));
        }
      });
      return all;
    }, [] as OptionModel[]);
    filters.classification = [...filters.classification, ...nonFacetedLabels];
    this.filterOptions = filters;
    this.dateForm.patchValue({
      start: filters.creation?.start?.date,
      end: filters.creation?.end?.date,
    });
    const labels = filters.classification.map((option) => getLabelFromFilter(option.id));
    this.displayedLabelSets = trimLabelSets(labelSets, labels);
    this.cdr.markForCheck();
  }

  onModeChange(mode: string) {
    this.searchMode = mode as SearchModes;
    this.resourceListService.setSearchMode(this.searchMode);
    this.query.pipe(take(1)).subscribe((query) => {
      if (query) {
        this.search();
      }
    });
  }

  getStatusFromParam(param: string): RESOURCE_STATUS | undefined {
    return param === 'processed'
      ? RESOURCE_STATUS.PROCESSED
      : param === 'pending'
        ? RESOURCE_STATUS.PENDING
        : param === 'error'
          ? RESOURCE_STATUS.ERROR
          : undefined;
  }
}
