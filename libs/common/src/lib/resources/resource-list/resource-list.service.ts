import { inject, Injectable } from '@angular/core';
import { LabelsService, SDKService } from '@flaps/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  expand,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  pairwise,
  reduce,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  DEFAULT_LABELS_LOGIC,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORTING,
  formatQuery,
  getSearchOptions,
  LabelsLogic,
  ResourceListParams,
  ResourceWithLabels,
  searchResources,
} from './resource-list.model';
import {
  IError,
  IResource,
  KnowledgeBox,
  LabelSets,
  ProcessingStatus,
  Resource,
  RESOURCE_STATUS,
  SortOption,
} from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
import { UploadService } from '../../upload/upload.service';
import { SisToastService } from '@nuclia/sistema';
import { ResourceNavigationService } from '../edit-resource/resource-navigation.service';
import { FormatETAPipe } from '../../pipes';

@Injectable({ providedIn: 'root' })
export class ResourceListService {
  private sdk = inject(SDKService);
  private labelService = inject(LabelsService);
  private translate = inject(TranslateService);
  private uploadService = inject(UploadService);
  private toastService = inject(SisToastService);
  private navigationService = inject(ResourceNavigationService);

  private _status?: RESOURCE_STATUS;
  get status() {
    return this._status;
  }
  set status(status: RESOURCE_STATUS | undefined) {
    this._status = status;
  }

  private _triggerResourceLoad = new Subject<{ replaceData: boolean; updateCount: boolean }>();
  private _filters = new BehaviorSubject<string[]>([]);
  filters = this._filters.asObservable();
  private _ready = new BehaviorSubject<boolean>(false);
  ready = this._ready.asObservable();
  private _data = new BehaviorSubject<ResourceWithLabels[]>([]);
  data = this._data.asObservable();
  private _query = new BehaviorSubject<string>('');
  query = this._query.asObservable();
  private _headerHeight = new BehaviorSubject<number>(0);
  headerHeight = this._headerHeight.asObservable();
  private _labelsLogic = new BehaviorSubject<LabelsLogic>(DEFAULT_LABELS_LOGIC);

  private _page = new BehaviorSubject<number>(0);
  page = this._page.asObservable();
  private _pageSize = new BehaviorSubject<number>(DEFAULT_PAGE_SIZE);
  pageSize = this._pageSize.asObservable();
  private _totalItems = new BehaviorSubject<number>(0);
  totalItems = this._totalItems.asObservable();
  totalPages = combineLatest([this._totalItems, this.pageSize]).pipe(
    map(([totalItems, pageSize]) => Math.ceil(totalItems / pageSize)),
  );

  labelSets: Observable<LabelSets> = this.labelService.resourceLabelSets.pipe(
    filter((labelSets) => !!labelSets),
    map((labelSets) => labelSets as LabelSets),
  );

  totalKbResources = this.uploadService.statusCount.pipe(map((count) => count.processed + count.pending + count.error));
  hiddenResourcesEnabled = this.sdk.currentKb.pipe(map((kb) => !!kb.hidden_resources_enabled));

  prevFilters = this._filters.pipe(
    startWith([]),
    pairwise(),
    map(([prev]) => prev),
    shareReplay(1),
  );
  prevLabelsLogic = this._labelsLogic.pipe(
    startWith(DEFAULT_LABELS_LOGIC),
    pairwise(),
    map(([prev]) => prev),
    shareReplay(1),
  );

  private _sort: SortOption = DEFAULT_SORTING;
  private _cursor?: string;
  private formatETA: FormatETAPipe = new FormatETAPipe();

  constructor() {
    this._triggerResourceLoad
      .pipe(
        switchMap(({ replaceData, updateCount }) =>
          this.loadResources(replaceData, updateCount).pipe(
            tap(() => {
              if (replaceData) {
                document.querySelector('.dashboard-content > main')?.scrollTo(0, 0);
              }
            }),
          ),
        ),
      )
      .subscribe();
  }

  clear() {
    this._ready.next(false);
    this._data.next([]);
    this._page.next(0);
    this._totalItems.next(0);
    this._sort = DEFAULT_SORTING;
    this._query.next('');
    this._filters.next([]);
    this._labelsLogic.next(DEFAULT_LABELS_LOGIC);
  }

  get sort(): SortOption {
    return this._sort;
  }

  filter(filters: string[], labelsLogic: LabelsLogic = DEFAULT_LABELS_LOGIC) {
    this._page.next(0);
    this._filters.next(filters);
    this._labelsLogic.next(labelsLogic);
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  loadPage(page: number) {
    this._page.next(page);
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  sortBy(sortOption: SortOption) {
    this._page.next(0);
    this._sort = sortOption;
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  search() {
    this._page.next(0);
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  setPageSize(pageSize: number) {
    this._page.next(0);
    this._pageSize.next(pageSize);
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  setQuery(query: string) {
    this._query.next(query);
  }

  setHeaderHeight(height: number) {
    this._headerHeight.next(height);
  }

  loadResources(replaceData = true, updateCount = true) {
    return forkJoin([
      this.status === RESOURCE_STATUS.PENDING
        ? this.loadPendingResources(replaceData)
        : this.loadResourcesFromCatalog(replaceData),
      updateCount ? this.uploadService.updateStatusCount() : of(undefined),
    ]).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error(`Error while loading results:`, error);
        this.toastService.error(this.translate.instant('resource.error.loading-failed'));
        this._data.next([]);
        return of(undefined);
      }),
    );
  }

  private loadPendingResources(replaceData: boolean): Observable<void> {
    if (replaceData) {
      this._cursor = undefined;
    }
    // at the moment /processing-status does not return all the pending resources
    // so, we start by loading the resources from the catalog, and then we fetch the processing status
    // and update the status of the resources
    return this.loadResourcesFromCatalog(replaceData).pipe(
      switchMap(() => this.sdk.currentKb),
      take(1),
      switchMap((kb) => kb.processingStatus(this._cursor, undefined, (this._page.value + 1) * this._pageSize.value)),
      switchMap((processingStatus) => {
        const resourceWithLabels = this.getPendingResourcesData(processingStatus);
        const newData = this._cursor ? this._data.value.concat(resourceWithLabels) : resourceWithLabels;
        const oldData = this._data.value;
        const mergedData = newData.reduce((deduplicatedList, data) => {
          const existingIndex = deduplicatedList.findIndex((item) => item.resource.id === data.resource.id);
          if (existingIndex > -1) {
            const existingData = deduplicatedList[existingIndex];
            deduplicatedList[existingIndex] = {
              ...existingData,
              resource: new Resource(this.sdk.nuclia, existingData.resource.kb, {
                ...existingData.resource,
                title: data.resource.title,
                metadata: data.resource.metadata
                  ? { ...existingData.resource.metadata, status: data.resource.metadata.status }
                  : existingData.resource.metadata,
              }),
              status: data.status,
              rank: data.rank,
            };
          }
          return deduplicatedList;
        }, oldData);
        // deduplication is reversing the order of the data, so we sort them back
        mergedData.sort((r1, r2) => (r1.rank || -1) - (r2.rank || -1));
        this._data.next(mergedData);
        this._ready.next(true);
        this._cursor = processingStatus.cursor;
        return of(undefined);
      }),
    );
  }

  private loadResourcesFromCatalog(replaceData: boolean): Observable<void> {
    const resourceListParams: ResourceListParams = {
      status: this.status,
      page: this._page.value,
      pageSize: this._pageSize.value,
      sort: this._sort,
      query: formatQuery(this._query.value),
      filters: this._filters.value,
      labelsLogic: this._labelsLogic.value,
    };
    return forkJoin([
      this.labelSets.pipe(take(1)),
      this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) => searchResources(kb, resourceListParams)),
      ),
    ]).pipe(
      map(([labelSets, { results, kbId }]) => {
        const newResults: ResourceWithLabels[] = Object.values(results.resources || {}).map((resourceData) =>
          this.getResourceWithLabelsAndErrors(kbId, resourceData, labelSets),
        );
        const newData = replaceData
          ? newResults
          : this._data.value.concat(newResults).reduce((deduplicatedList, data) => {
              if (!deduplicatedList.find((item) => item.resource.id === data.resource.id)) {
                deduplicatedList.push(data);
              }
              return deduplicatedList;
            }, [] as ResourceWithLabels[]);
        const hasMore = !!results.fulltext?.next_page;
        this._data.next(newData);
        this._ready.next(true);
        this._totalItems.next(results.fulltext?.total || 0);
        this.navigationService.navigationData = {
          ...resourceListParams,
          resourceIdList: newData.map((data) => data.resource.id),
          hasMore,
        };
        return;
      }),
    );
  }

  private getResourceWithLabelsAndErrors(
    kbId: string,
    resourceData: IResource,
    labelSets: LabelSets,
  ): ResourceWithLabels {
    const resource = new Resource(this.sdk.nuclia, kbId, resourceData);
    const resourceWithLabels: ResourceWithLabels = {
      resource,
      labels: [],
    };
    const labels = resource.getClassifications();
    if (labels.length > 0) {
      resourceWithLabels.labels = labels.map((label) => ({
        ...label,
        color: labelSets[label.labelset]?.color || '#ffffff',
      }));
    }
    const errors = resource
      .getFields()
      .reduce((errors, field) => errors.concat(field.errors || field.error || []), [] as IError[])
      .map((error) => error?.body || '')
      .filter((error) => !!error);
    if (errors.length > 0) {
      resourceWithLabels.errors = errors.join('. ');
    }

    return resourceWithLabels;
  }

  private getPendingResourcesData(processingStatus: {
    cursor?: string;
    results: ProcessingStatus[];
  }): ResourceWithLabels[] {
    return processingStatus.results.map((data) => {
      const iResource: IResource = {
        id: data.resource_id,
        title: data.title || this.translate.instant('resource.status.deleted'),
        created: data.timestamp,
        metadata: {
          status: data.title ? RESOURCE_STATUS.PENDING : RESOURCE_STATUS.DELETED,
        },
      };
      const resource = new Resource(this.sdk.nuclia, data.kbid, iResource);
      const eta = this.formatETA.transform(data.schedule_eta);
      return {
        resource,
        labels: [],
        status:
          data.schedule_order === -1
            ? this.translate.instant('resource.status.processing')
            : `${this.translate.instant('resource.status.rank', { rank: data.schedule_order })}
<br>${this.translate.instant('resource.status.starts-in', { eta })}`,
        rank: data.schedule_order,
      };
    });
  }

  getAllResources(
    sort: SortOption = DEFAULT_SORTING,
    status?: RESOURCE_STATUS,
    applyFilters = false,
  ): Observable<{ resources: Resource[]; incomplete: boolean }> {
    let kb: KnowledgeBox;
    let errors = 0;
    const query = applyFilters ? formatQuery(this._query.value) : '';
    const filters = applyFilters
      ? { filters: this._filters.value, labelsLogic: this._labelsLogic.value, query }
      : { filters: [], query };
    const getResourcesPage = (kb: KnowledgeBox, page = 0) => {
      const searchOptions = getSearchOptions({ page, sort, status, pageSize: 200, ...filters });
      return kb.catalog(query, searchOptions);
    };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((current) => {
        kb = current;
        return getResourcesPage(kb);
      }),
      expand((results) =>
        results.type !== 'error' && results.fulltext?.next_page
          ? getResourcesPage(kb, results.fulltext?.page_number + 1)
          : EMPTY,
      ),
      map((results) => {
        if (results.type === 'error') {
          errors++;
          return [];
        } else {
          return Object.values(results.resources || {}).map(
            (resourceData: IResource) => new Resource(this.sdk.nuclia, kb.id, resourceData),
          );
        }
      }),
      reduce((accData, data) => accData.concat(data), [] as Resource[]),
      map((resources) => ({ resources, incomplete: errors > 0 })),
    );
  }

  downloadResources(status?: RESOURCE_STATUS) {
    return this.getAllResources(undefined, status).pipe(
      tap((result) => {
        const header = 'Id,Title,Labels,Date';
        const rows = result.resources.map((resource) => {
          const labels = resource.getClassifications().map((label) => `${label.labelset}/${label.label}`);
          const date = resource.created ? new Date(`${resource.created}Z`).toISOString() : '';
          return `${resource.id},"${this.formatCellValue(resource.title || '')}","${this.formatCellValue(
            labels.join(','),
          )}",${date}`;
        });
        const filename = `${new Date().toISOString().split('T')[0]}_Nuclia_resource_list${
          status ? '_' + status.toLowerCase() : ''
        }.csv`;
        const content = `${header}\n${rows.join('\n')}`;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        link.click();
        URL.revokeObjectURL(url);
        if (result.incomplete) {
          this.toastService.warning('resource.pagination.download-incomplete');
        }
      }),
    );
  }

  private formatCellValue(value: string) {
    return value.replace(/"/g, '""');
  }
}
