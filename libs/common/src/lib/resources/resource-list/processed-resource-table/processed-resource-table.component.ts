import { ChangeDetectionStrategy, Component, inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ColoredLabel, ColumnHeader, DEFAULT_PREFERENCES, RESOURCE_LIST_PREFERENCES } from '../resource-list.model';
import { map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  from,
  Observable,
  of,
  skip,
  Subject,
  take,
  toArray,
} from 'rxjs';
import { HeaderCell, OptionModel } from '@guillotinaweb/pastanaga-angular';
import {
  Classification,
  deDuplicateList,
  LabelSets,
  Resource,
  RESOURCE_STATUS,
  Search,
  UserClassification,
} from '@nuclia/core';
import { LabelsService } from '@flaps/core';
import { Filters, formatFiltersFromFacets, MIME_FACETS } from '../../resource-filters.utils';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { ResourcesTableDirective } from '../resources-table.directive';
import { UploadService } from '../../../upload';
import { getClassificationsPayload } from '../../edit-resource';

@Component({
  selector: 'stf-processed-resource-table',
  templateUrl: './processed-resource-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessedResourceTableComponent extends ResourcesTableDirective implements OnInit, OnDestroy, OnChanges {
  private uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(
    map((statusCount) => statusCount.processed + statusCount.pending + statusCount.error),
  );
  labelSets = this.resourceListService.labelSets;
  isReady = this.resourceListService.ready;
  query = this.resourceListService.query;

  get initialColumns(): ColumnHeader[] {
    return [
      { id: 'title', label: 'resource.title', size: 'minmax(280px, 3fr)', sortable: false, visible: true },
      {
        id: 'classification',
        label: 'resource.classification-column',
        size: 'minmax(304px, 1fr)',
        optional: true,
        visible: this.userPreferences.columns.includes('classification'),
      },
      {
        id: 'created',
        label: 'generic.date',
        size: '128px',
        sortable: true,
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('created'),
      },
      {
        id: 'language',
        label: 'generic.language',
        size: '112px',
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('language'),
      },
    ];
  }
  userPreferences: typeof DEFAULT_PREFERENCES;

  // Set in constructor depending on user preferences
  protected override defaultColumns: ColumnHeader[];
  optionalColumns: ColumnHeader[];
  columnVisibilityUpdate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  hasLabelSets = inject(LabelsService).hasResourceLabelSets;
  currentLabelList: Classification[] = [];
  deletingLabel = false;

  private _visibleColumnDef: Observable<ColumnHeader[]> = combineLatest([
    this.isAdminOrContrib,
    this.columnVisibilityUpdate,
  ]).pipe(
    map(([canEdit]) => {
      const visibleColumns = this.defaultColumns.map(this.getApplySortingMapper()).filter((column) => column.visible);
      return canEdit
        ? [...visibleColumns, { id: 'menu', label: 'generic.actions', size: '96px' }]
        : [...visibleColumns];
    }),
  );
  override headerCells: Observable<HeaderCell[]> = this._visibleColumnDef.pipe(
    map((cells) => cells.map((cell) => new HeaderCell(cell))),
  );
  visibleColumnsId: Observable<string[]> = this._visibleColumnDef.pipe(map((cells) => cells.map((cell) => cell.id)));
  override tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this._visibleColumnDef]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );

  hasFilters = false;
  isFiltering = false;
  filterOptions: Filters = {
    classification: [],
    mainTypes: [],
  };

  unsubscribeAll = new Subject<void>();

  private localStorage = inject(LOCAL_STORAGE);

  constructor() {
    super();
    const pref = this.localStorage.getItem(RESOURCE_LIST_PREFERENCES);
    if (pref) {
      try {
        this.userPreferences = JSON.parse(pref);
      } catch (e) {
        this.userPreferences = DEFAULT_PREFERENCES;
        this.localStorage.setItem(RESOURCE_LIST_PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      }
    } else {
      this.userPreferences = DEFAULT_PREFERENCES;
    }
    this.defaultColumns = this.initialColumns;
    this.optionalColumns = this.defaultColumns.filter((column) => column.optional);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.columnVisibilityUpdate.pipe(skip(1), takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.userPreferences.columns = this.defaultColumns
        .map((column) => (column.optional && column.visible ? column.id : ''))
        .filter((value) => !!value);
      this.localStorage.setItem(RESOURCE_LIST_PREFERENCES, JSON.stringify(this.userPreferences));
    });

    this.isShardReady
      .pipe(
        filter((ready) => ready),
        take(1),
        switchMap(() => this.loadFilters()),
      )
      .subscribe();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].isFirstChange()) {
      this.deletingLabel = false;
    }
  }

  onRemoveLabel(
    resource: Resource,
    labelToRemove: ColoredLabel,
    $event: { event: MouseEvent | KeyboardEvent; value: any },
  ) {
    this.deletingLabel = true;
    $event.event.stopPropagation();
    $event.event.preventDefault();

    let classifications: UserClassification[] = resource.usermetadata?.classifications || [];
    if (!labelToRemove.immutable) {
      classifications = classifications.filter(
        (label) => !(label.labelset === labelToRemove.labelset && label.label === labelToRemove.label),
      );
    } else {
      classifications.push({
        label: labelToRemove.label,
        labelset: labelToRemove.labelset,
        cancelled_by_user: true,
      });
    }
    resource
      .modify({
        usermetadata: {
          ...resource.usermetadata,
          classifications,
        },
      })
      .pipe(
        switchMap(() => this.resourceListService.loadResources(true, false)),
        catchError(() => {
          this.toaster.error(
            `An error occurred while removing "${labelToRemove.labelset} – ${labelToRemove.label}" label, please try again later.`,
          );
          return this.resourceListService.loadResources(true, false);
        }),
      )
      .subscribe(() => {
        this.deletingLabel = false;
        this.cdr.markForCheck();
      });
  }

  updateLabelList(list: Classification[]) {
    this.currentLabelList = list;
  }

  addLabelsToSelection() {
    if (this.currentLabelList.length > 0) {
      this.getSelectedResources()
        .pipe(
          switchMap((resources) => {
            this.bulkAction = {
              inProgress: true,
              done: 0,
              errors: 0,
              total: resources.length,
              label: 'resource.adding_labels',
            };
            const requests = resources.map((resource) => {
              return this.resourceListService.labelSets.pipe(
                take(1),
                map((labelSets) => ({
                  usermetadata: {
                    ...resource.usermetadata,
                    classifications: this.mergeExistingAndSelectedLabels(resource, labelSets, this.currentLabelList),
                  },
                })),
                switchMap((updatedResource) =>
                  resource.modify(updatedResource).pipe(
                    map(() => ({ isError: false })),
                    catchError((error) => of({ isError: true, error })),
                  ),
                ),
              );
            });

            return from(requests).pipe(
              mergeMap((obs) => obs, 6),
              toArray(),
              tap((results) => {
                const errorCount = results.filter((res) => res.isError).length;
                const successCount = results.length - errorCount;
                this.bulkAction = {
                  inProgress: true,
                  done: successCount,
                  errors: errorCount,
                  total: resources.length,
                  label: 'resource.adding_labels',
                };
                if (successCount > 0) {
                  this.toaster.success(this.translate.instant('resource.add_labels_success', { count: successCount }));
                }
                if (errorCount > 0) {
                  this.toaster.error(this.translate.instant('resource.add_labels_error', { count: errorCount }));
                }
              }),
              switchMap(() => this.resourceListService.loadResources(true, false)),
            );
          }),
        )
        .subscribe(() => {
          this.bulkAction = {
            inProgress: false,
            done: 0,
            total: 0,
            errors: 0,
            label: '',
          };
          this.cdr.markForCheck();
        });
    }
  }

  selectColumn(column: ColumnHeader, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      column.visible = !column.visible;
      this.columnVisibilityUpdate.next(!column.visible);
    }
  }

  onSelectFilter(option: OptionModel, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      option.selected = !option.selected;
      this.onToggleFilter();
    }
  }

  onToggleFilter() {
    const filters = this.selectedFilters;
    if (filters.length > 0) {
      this.router.navigate(['./'], { relativeTo: this.route, queryParams: { filters } });
      this.resourceListService.filter(filters);
      this.isFiltering = filters.length > 0;
    } else {
      this.clearFilters();
    }
  }

  clearFilters() {
    this.router.navigate(['./'], { relativeTo: this.route, queryParams: {} });
    this.resourceListService.filter([]);
    this.isFiltering = false;
    this.filterOptions.classification.forEach((option) => (option.selected = false));
    this.filterOptions.mainTypes.forEach((option) => (option.selected = false));
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
      this.resourceListService.filters.pipe(take(1)),
    ]).pipe(
      switchMap(([kb, labelSets, queryParams, filters]) => {
        const faceted = MIME_FACETS.concat(Object.keys(labelSets).map((setId) => `/l/${setId}`));
        return kb.catalog('', { faceted }).pipe(map((results) => ({ results, queryParams, filters })));
      }),
      map(({ results, queryParams, filters }) => {
        if (results.type !== 'error') {
          const previousFilters = queryParams.get('preserveFilters') ? filters : queryParams.getAll('filters');
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
    this.hasFilters = filters.classification.length > 0 || filters.mainTypes.length > 0;
    this.cdr.markForCheck();
  }

  private mergeExistingAndSelectedLabels(
    resource: Resource,
    labelSets: LabelSets,
    labels: Classification[],
  ): Classification[] {
    const exclusiveLabelSets = Object.entries(labelSets)
      .filter(([, labelSet]) => !labelSet.multiple)
      .filter(([id]) => labels.some((label) => label.labelset === id))
      .map(([id]) => id);

    const resourceLabels = resource
      .getClassifications()
      .filter((label) => !exclusiveLabelSets.includes(label.labelset));

    return getClassificationsPayload(
      resource,
      deDuplicateList(resourceLabels.concat(labels.map((label) => ({ ...label, cancelled_by_user: false })))),
    );
  }
}
