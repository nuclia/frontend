import { inject, Injectable } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { BehaviorSubject, catchError, forkJoin, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORTING,
  ResourceListParams,
  ResourceWithLabels,
  searchResources,
} from './resource-list.model';
import {
  IResource,
  LabelSets,
  ProcessingStatusResponse,
  Resource,
  RESOURCE_STATUS,
  Search,
  SortOption,
} from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
import { LabelsService } from '../../label/labels.service';
import { UploadService } from '../../upload/upload.service';
import { SisToastService } from '@nuclia/sistema';
import { ResourceNavigationService } from '../edit-resource/resource-navigation.service';

@Injectable({ providedIn: 'root' })
export class ResourceListService {
  private sdk = inject(SDKService);
  private labelService = inject(LabelsService);
  private translate = inject(TranslateService);
  private stateService = inject(StateService);
  private uploadService = inject(UploadService);
  private toastService = inject(SisToastService);
  private navigationService = inject(ResourceNavigationService);

  private processingStatus?: ProcessingStatusResponse;
  private _status: RESOURCE_STATUS = RESOURCE_STATUS.PROCESSED;
  get status() {
    return this._status;
  }
  set status(status: RESOURCE_STATUS) {
    this._status = status;
    if (status === RESOURCE_STATUS.PENDING && !this.sdk.nuclia.options.standalone) {
      forkJoin([this.stateService.account.pipe(take(1)), this.stateService.kb.pipe(take(1))])
        .pipe(
          filter(([account, kb]) => !!account && !!kb),
          take(1),
          switchMap(([account]) => this.sdk.nuclia.db.getProcessingStatus(account!.id)),
        )
        .subscribe((processingStatus) => (this.processingStatus = processingStatus));
    }
  }

  private _triggerResourceLoad = new Subject<{ replaceData: boolean; updateCount: boolean }>();
  private _filters = new BehaviorSubject<string[]>([]);
  filters = this._filters.asObservable();
  private _ready = new BehaviorSubject<boolean>(false);
  ready = this._ready.asObservable();
  private _data = new BehaviorSubject<ResourceWithLabels[]>([]);
  data = this._data.asObservable();
  private _emptyKb = new Subject<boolean>();
  emptyKb = this._emptyKb.asObservable();

  labelSets: Observable<LabelSets> = this.labelService.resourceLabelSets.pipe(
    filter((labelSets) => !!labelSets),
    map((labelSets) => labelSets as LabelSets),
  );

  private _page = 0;
  private _hasMore = false;
  private _pageSize = DEFAULT_PAGE_SIZE;
  private _sort: SortOption = DEFAULT_SORTING;
  private _query = '';
  private _titleOnly = true;

  constructor() {
    this._triggerResourceLoad
      .pipe(switchMap(({ replaceData, updateCount }) => this.loadResources(replaceData, updateCount)))
      .subscribe();
  }

  clear() {
    this._ready.next(false);
    this._data.next([]);
    this._page = 0;
    this._hasMore = false;
    this._pageSize = DEFAULT_PAGE_SIZE;
    this._sort = DEFAULT_SORTING;
    this._query = '';
    this._titleOnly = true;
  }

  get sort(): SortOption {
    return this._sort;
  }

  filter(filters: string[]) {
    this._filters.next(filters);
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  loadMore() {
    if (this._hasMore) {
      this._page += 1;
      this._triggerResourceLoad.next({ replaceData: false, updateCount: false });
    }
  }

  sortBy(sortOption: SortOption) {
    this._sort = sortOption;
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  search(query: string, titleOnly: boolean) {
    this._query = query;
    this._titleOnly = titleOnly;
    this._triggerResourceLoad.next({ replaceData: true, updateCount: false });
  }

  loadResources(replaceData = true, updateCount = true): Observable<void> {
    if (replaceData) {
      this._page = 0;
    }

    const resourceListParams: ResourceListParams = {
      status: this.status,
      page: this._page,
      pageSize: this._pageSize,
      sort: this._sort,
      query: this._query,
      titleOnly: this._titleOnly,
      filters: this._filters.value,
    };
    return forkJoin([
      this.labelSets.pipe(take(1)),
      this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) => searchResources(kb, resourceListParams)),
      ),
    ]).pipe(
      map(([labelSets, data]) => {
        const newResults: ResourceWithLabels[] = this._titleOnly
          ? this.getTitleOnlyData(data.results, data.kbId, labelSets)
          : this.getResourceData(this._query, data.results, data.kbId, labelSets);
        const newData =
          this._page === 0
            ? newResults
            : this._data.value.concat(newResults).reduce((deduplicatedList, data) => {
                if (!deduplicatedList.find((item) => item.resource.id === data.resource.id)) {
                  deduplicatedList.push(data);
                }
                return deduplicatedList;
              }, [] as ResourceWithLabels[]);
        const hasMore = !!data.results.fulltext?.next_page;
        this._data.next(newData);
        this._ready.next(true);
        this._hasMore = hasMore;
        this.navigationService.navigationData = {
          ...resourceListParams,
          resourceIdList: newData.map((data) => data.resource.id),
          hasMore,
        };
        return;
      }),
      switchMap(() =>
        updateCount
          ? this.uploadService.updateStatusCount().pipe(
              tap((count) => this._emptyKb.next(count.error === 0 && count.pending === 0 && count.processed === 0)),
              map(() => {}),
            )
          : of(undefined),
      ),
      catchError((error) => {
        console.error(`Error while loading results:`, error);
        this.toastService.error(this.translate.instant('resource.error.loading-failed'));
        this._data.next([]);
        return of(undefined);
      }),
    );
  }

  private getTitleOnlyData(results: Search.Results, kbId: string, labelSets: LabelSets): ResourceWithLabels[] {
    return Object.values(results.resources || {}).map((resourceData) =>
      this.getResourceWithLabels(kbId, resourceData, labelSets),
    );
  }

  private getResourceWithLabels(kbId: string, resourceData: IResource, labelSets: LabelSets): ResourceWithLabels {
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
    if (this.status === 'PENDING' && this.processingStatus) {
      resourceWithLabels.status = this.getProcessingStatus(resource, this.processingStatus);
    }

    return resourceWithLabels;
  }

  private getResourceData(
    trimmedQuery: string,
    results: Search.Results,
    kbId: string,
    labelSets: LabelSets,
  ): ResourceWithLabels[] {
    const allResources = results.resources;
    if (!allResources || Object.keys(allResources).length === 0) {
      return [];
    }
    const fulltextOrderedResources: IResource[] =
      results.fulltext?.results.reduce((resources, result) => {
        const iResource: IResource = allResources[result.rid];
        if (result && iResource && !resources.find((resource) => resource.id === result.rid)) {
          resources.push(iResource);
        }
        return resources;
      }, [] as IResource[]) || [];
    const smartResults = fulltextOrderedResources.map((resourceData) =>
      this.getResourceWithLabels(kbId, resourceData, labelSets),
    );

    // if not a keyword search, fill results with the 2 best semantic sentences
    const looksLikeKeywordSearch = trimmedQuery.split(' ').length < 3;
    if (!looksLikeKeywordSearch) {
      const semanticResults = results.sentences?.results || [];
      const twoBestSemantic = semanticResults.slice(0, 2);
      twoBestSemantic.forEach((sentence) => {
        const resourceIndex = smartResults.findIndex((result) => result.resource.id === sentence.rid);
        if (resourceIndex > -1 && !smartResults[resourceIndex].description) {
          smartResults[resourceIndex].description = sentence.text;
        }
      });
    }

    // Fill the rest of the results with first paragraph
    const paragraphResults = results.paragraphs?.results || [];
    smartResults.forEach((result) => {
      if (!result.description) {
        const paragraph = paragraphResults.find((paragraph) => paragraph.rid === result.resource.id);
        if (paragraph) {
          result.description = paragraph.text;
        } else {
          // use summary as description when no paragraph
          result.description = result.resource.summary;
        }
      }
    });

    return smartResults;
  }

  private getProcessingStatus(resource: Resource, processingStatus: ProcessingStatusResponse): string {
    if (!processingStatus) {
      return '';
    }
    const last_delivered_seqid =
      resource.queue === 'private'
        ? processingStatus.account?.last_delivered_seqid
        : processingStatus.shared?.last_delivered_seqid;
    if (resource.last_account_seq !== undefined) {
      const count =
        typeof last_delivered_seqid === 'number'
          ? resource.last_account_seq - last_delivered_seqid
          : resource.last_account_seq - 1;
      let statusKey = 'resource.status_processing';
      if (count === 1) {
        statusKey = 'resource.status_next';
      } else if (count > 1) {
        statusKey = 'resource.status_pending';
      }
      return this.translate.instant(statusKey, { count });
    } else {
      return this.translate.instant('resource.status_unknown');
    }
  }
}
