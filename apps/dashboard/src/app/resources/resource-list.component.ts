import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectionModel } from '@angular/cdk/collections';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilKeyChanged,
  forkJoin,
  from,
  mergeMap,
  Observable,
  of,
  Subject,
  take,
} from 'rxjs';
import { debounceTime, delay, filter, map, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Classification,
  deDuplicateList,
  IResource,
  LabelSets,
  ProcessingStatusResponse,
  Resource,
  ResourceStatus,
  resourceToAlgoliaFormat,
  Search,
} from '@nuclia/core';
import { BackendConfigurationService, SDKService, StateService, STFUtils } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { DomSanitizer } from '@angular/platform-browser';
import { ResourceViewerService } from './resource-viewer.service';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';
import { SampleDatasetService } from './sample-dataset/sample-dataset.service';
import { LabelsService } from '../services/labels.service';
import { PopoverDirective } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';

interface ListFilters {
  type?: string;
  title?: string;
  status?: string;
  page?: string;
  size?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface KeyValue {
  key: string;
  value: string;
}

interface ColoredLabel extends Classification {
  color: string;
}

interface ResourceWithLabels {
  resource: Resource;
  labels: ColoredLabel[];
  description?: string;
  status?: string;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
const POPOVER_DISPLAYED = 'NUCLIA_STATUS_POPOVER_DISPLAYED';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('pendingPopoverDirective') pendingPopoverDirective?: PopoverDirective;
  @ViewChild('failedPopoverDirective') failedPopoverDirective?: PopoverDirective;

  private localStorage = inject(LOCAL_STORAGE);
  private sampleDatasetService = inject(SampleDatasetService);
  hasSampleData = this.sampleDatasetService.hasSampleResources();
  hasLabelSets = inject(LabelsService).hasLabelSets();

  data: ResourceWithLabels[] | undefined;
  resultsLength = 0;
  totalResources = 0;
  isLoading = true;
  selection = new SelectionModel<Resource>(true, []);
  filterTitle: UntypedFormControl;
  unsubscribeAll = new Subject<void>();
  refreshing = true;

  private _statusCount: BehaviorSubject<{ pending: number; error: number }> = new BehaviorSubject({
    pending: 0,
    error: 0,
  });
  statusCount = this._statusCount.asObservable().pipe(
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

  statusDisplayed: BehaviorSubject<ResourceStatus> = new BehaviorSubject<ResourceStatus>('PROCESSED');
  private currentProcessingStatus?: ProcessingStatusResponse;

  get isMainView() {
    return this.statusDisplayed.value === 'PROCESSED';
  }
  get showActions() {
    return this.statusDisplayed.value !== 'PENDING';
  }

  pageSizeOptions: Observable<KeyValue[]> = forkJoin(
    PAGE_SIZE_OPTIONS.map((size) =>
      of(size.toString()).pipe(
        switchMap((size) =>
          this.translate
            .get('resource.resource_page_number', { num: size })
            .pipe(map((text) => ({ key: size, value: text }))),
        ),
      ),
    ),
  );
  columns = [
    { value: 'title', label: 'resource.title', visible: true, showInPending: true },
    { value: 'classification', label: 'resource.classification', visible: false, optional: true },
    { value: 'modification', label: 'generic.date', visible: true, optional: true, showInPending: true },
    { value: 'language', label: 'generic.language', visible: true, optional: true },
    { value: 'status', label: 'resource.status', visible: false, optional: true, showInPending: true },
  ];
  columnVisibilityUpdate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  optionalColumns = this.columns.filter((column) => column.optional && column.value !== 'status');
  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  displayedColumns = combineLatest([this.isAdminOrContrib, this.statusDisplayed, this.columnVisibilityUpdate]).pipe(
    map(([canEdit, statusDisplayed]) => {
      const columns = this.columns
        .map((column) => {
          if (statusDisplayed === 'PENDING') {
            return column.showInPending ? column.value : '';
          } else {
            return !column.optional || column.visible ? column.value : '';
          }
        })
        .filter((column) => !!column);

      return canEdit && this.showActions ? ['select', ...columns, 'actions'] : columns;
    }),
  );
  labelSets$ = this.sdk.currentKb.pipe(switchMap((kb) => kb.getLabels()));
  currentLabelList: Classification[] = [];

  viewerWidget = this.sdk.currentKb.pipe(
    distinctUntilKeyChanged('id'),
    tap(() => {
      document.getElementById('viewer-widget')?.remove();
    }),
    map((kb) => {
      const features = DEFAULT_FEATURES_LIST.split(',')
        .filter((feature) => feature !== 'filter')
        .join(',');
      return this.sanitized.bypassSecurityTrustHtml(`<nuclia-viewer id="viewer-widget"
        knowledgebox="${kb.id}"
        zone="${this.sdk.nuclia.options.zone}"
        client="dashboard"
        cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
        backend="${this.backendConfig.getAPIURL()}"
        state="${kb.state || ''}"
        kbslug="${kb.slug || ''}"
        account="${kb.account || ''}"
        features="${features}"
        lang="${this.translate.currentLang}"
      ></nuclia-viewer>`);
    }),
  );

  searchForm = new FormGroup({
    searchIn: new FormControl<'title' | 'resource'>('title'),
    query: new FormControl<string>(''),
  });

  constructor(
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
    private stateService: StateService,
    private toaster: SisToastService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private resourceViewer: ResourceViewerService,
  ) {
    const title = this.filters.title;
    this.filterTitle = new UntypedFormControl([title ? title : '']);

    this.filterTitle.valueChanges.pipe(takeUntil(this.unsubscribeAll), debounceTime(200)).subscribe(() => {
      const title = this.filterTitle.value;
      this.applyFilter({
        title: title.length > 0 ? title : undefined,
      });
    });
  }

  ngAfterViewInit() {
    this.resourceViewer.init('viewer-widget');
  }

  ngOnInit(): void {
    this.getResources().subscribe();
    this.updateStatusCount();
    this.sdk.counters.pipe(takeUntil(this.unsubscribeAll)).subscribe((counters) => {
      this.totalResources = counters.resources;
      this.refreshing = false;
      this.cdr?.markForCheck();
    });
    this.sdk.refreshing
      .pipe(
        takeUntil(this.unsubscribeAll),
        tap(() => (this.refreshing = true)),
        switchMap(() => this.getResources()),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onUpload() {
    this.updateStatusCount();
  }

  search() {
    if (!this.searchForm.value.query) {
      this.searchForm.controls.searchIn.setValue('title');
    }
    this.changeQueryParams({ page: undefined });
  }

  bulkDelete() {
    this.delete(this.selection.selected);
  }

  delete(resources: Resource[]) {
    const title = resources.length > 1 ? 'resource.delete_resources_confirm' : 'resource.delete_resource_confirm';
    const message = resources.length > 1 ? 'resource.delete_resources_warning' : 'resource.delete_resource_warning';
    this.modalService
      .openConfirm({
        title,
        description: message,
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        tap(() => this.setLoading(true)),
        switchMap(() => from(resources.map((resource) => resource.delete()))),
        mergeMap((resourceDelete) => resourceDelete, 6),
        toArray(),
      )
      .subscribe(() => {
        this.selection.clear();
        setTimeout(() => {
          this.setLoading(false);
          this.sdk.refreshCounter(true);
        }, 1000);
      });
  }

  reindex(resource: Resource) {
    resource
      .reprocess()
      .pipe(
        delay(500), // wait for reprocess to be effective
        switchMap(() => this.getResources()),
      )
      .subscribe();
  }

  edit(uid: string) {
    this.router.navigate([`./${uid}`], { relativeTo: this.route });
  }

  get filters(): ListFilters {
    return {
      ...this.route.snapshot.queryParams,
      size: this.pageSize.toString(),
      page: this.pageSize.toString(),
    };
  }

  get pageSize(): number {
    const size = this.route.snapshot.queryParams.size;
    return size ? parseInt(size, 10) : DEFAULT_PAGE_SIZE;
  }

  get page(): number {
    const page = this.route.snapshot.queryParams.page;
    return page ? parseInt(page, 10) : this.resultsLength > 0 ? 1 : 0;
  }

  get totalPages(): number {
    return Math.ceil(this.resultsLength / this.pageSize);
  }

  viewResource(resourceId: string) {
    (document.getElementById('viewer-widget') as unknown as any)?.displayResource(resourceId);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = Math.min(this.resultsLength, this.pageSize);
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.data?.forEach((row) => this.selection.select(row.resource));
    this.cdr?.markForCheck();
  }

  clearSelected() {
    this.selection.clear();
    this.cdr?.markForCheck();
  }

  setPageSize(size: KeyValue) {
    this.applyFilter({
      size: size.key,
    });
  }

  nextPage() {
    const params = { page: (this.page + 1).toString() };
    this.changeQueryParams(params);
  }

  prevPage() {
    const params = { page: (this.page - 1).toString() };
    this.changeQueryParams(params);
  }

  sortBy(attribute: string) {
    const params: ListFilters = {};
    if (this.filters.sortBy !== attribute) {
      params.sortBy = attribute;
      params.sortDirection = 'desc';
    } else {
      params.sortDirection = this.filters.sortDirection === 'desc' ? 'asc' : 'desc';
    }
    this.applyFilter({ ...params });
  }

  applyFilter(params: ListFilters) {
    params.page = undefined;
    this.changeQueryParams(params);
  }

  changeQueryParams(params: ListFilters) {
    from(
      this.router.navigate(['.'], {
        queryParams: params,
        queryParamsHandling: 'merge',
        relativeTo: this.route,
        replaceUrl: true,
      }),
    )
      .pipe(switchMap(() => this.getResources()))
      .subscribe();
  }

  getResources(): Observable<Search.Results> {
    const query = (this.searchForm.value.query || '').trim();
    const hasQuery = query.length > 0;
    const titleOnly = this.searchForm.value.searchIn === 'title';
    const page = this.page >= 1 ? this.page - 1 : 0;

    forkJoin([this.stateService.account.pipe(take(1)), this.stateService.stash.pipe(take(1))])
      .pipe(
        filter(([account, kb]) => !!account && !!kb),
        take(1),
        switchMap(([account]) => this.sdk.nuclia.db.getProcessingStatus(account!.id)),
      )
      .subscribe((status) => (this.currentProcessingStatus = status));

    return of(1).pipe(
      tap(() => {
        this.setLoading(true);
      }),
      switchMap(() => this.sdk.currentKb.pipe(take(1))),
      switchMap((kb) => {
        const searchFeatures =
          hasQuery && !titleOnly
            ? [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT]
            : [Search.Features.DOCUMENT];
        return forkJoin([
          of(kb),
          kb.search(query, searchFeatures, {
            inTitleOnly: titleOnly,
            page_number: page,
            page_size: this.pageSize,
            sort: 'created',
            with_status: this.statusDisplayed.value,
          }),
          this.labelSets$.pipe(take(1)),
        ]);
      }),
      map(([kb, results, labelSets]) => {
        // FIXME: currently the backend doesn't provide the real total in pagination, if there is more than 1 page of result they return the number of item by page as total
        this.data = titleOnly
          ? this.getTitleOnlyData(results, kb.id, labelSets)
          : this.getResourceData(query, results, kb.id, labelSets);
        if (hasQuery && results.fulltext) {
          this.resultsLength =
            results.fulltext.next_page || results.fulltext.page_number > 0
              ? this.totalResources || this.data.length
              : 1;
        } else {
          // totalResources can be 0 while we have resources (specially when we import dataset) because counters is asynchronous and relies on indexing
          this.resultsLength = this.totalResources || this.data.length;
        }
        this.clearSelected();
        this.setLoading(false);
        return results;
      }),
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
    if (this.statusDisplayed.value === 'PENDING' && this.currentProcessingStatus) {
      resourceWithLabels.status = this.getProcessingStatus(resource);
    }

    return resourceWithLabels;
  }

  private getProcessingStatus(resource: Resource): string {
    if (!this.currentProcessingStatus) {
      return '';
    }
    const last_delivered_seqid =
      resource.queue === 'private'
        ? this.currentProcessingStatus.account?.last_delivered_seqid
        : this.currentProcessingStatus.shared?.last_delivered_seqid;
    if (last_delivered_seqid && resource.last_account_seq !== undefined) {
      const count = resource.last_account_seq - last_delivered_seqid;
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

  private getTitleOnlyData(results: Search.Results, kbId: string, labelSets: LabelSets): ResourceWithLabels[] {
    return Object.values(results.resources || {}).map((resourceData) =>
      this.getResourceWithLabels(kbId, resourceData, labelSets),
    );
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

  downloadAlgoliaJson(resource: Resource) {
    this.sdk.currentKb.pipe(switchMap((kb) => kb.getResource(resource.uuid))).subscribe((fullResource) => {
      const formatted = resourceToAlgoliaFormat(fullResource, this.sdk.nuclia.regionalBackend);
      STFUtils.downloadJson(formatted, `algolia_record.json`);
    });
  }

  updateLabelList($event: Classification[]) {
    this.currentLabelList = $event;
  }

  addLabelsToSelection() {
    if (this.currentLabelList.length > 0) {
      const requests = this.selection.selected.map((resource) => {
        const updatedResource = {
          usermetadata: {
            ...resource.usermetadata,
            classifications: this.mergeExistingAndSelectedLabels(resource.usermetadata?.classifications || []),
          },
        };
        return resource.modify(updatedResource).pipe(
          map(() => ({ isError: false })),
          catchError((error) => of({ isError: true, error })),
        );
      });

      forkJoin(requests)
        .pipe(
          tap((results) => {
            const errorCount = results.filter((res) => res.isError).length;
            const successCount = results.length - errorCount;
            if (successCount > 0) {
              this.toaster.success(this.translate.instant('resource.add_labels_success', { count: successCount }));
            }
            if (errorCount > 0) {
              this.toaster.error(this.translate.instant('resource.add_labels_error', { count: errorCount }));
            }
          }),
          switchMap(() => this.getResources()),
        )
        .subscribe(() => {
          this.currentLabelList = [];
        });
    }
  }

  deleteSampleDataset() {
    this.toaster.info('onboarding.dataset.delete_in_progress');
    this.sampleDatasetService
      .deleteSampleDataset()
      .pipe(
        tap((count) => {
          if (count.error === 0) {
            this.toaster.success('onboarding.dataset.delete_successful');
          } else if (count.success > 0) {
            this.toaster.warning(
              this.translate.instant('onboarding.dataset.delete_partially_successful', { error: count.error }),
            );
          } else {
            this.toaster.error('onboarding.dataset.delete_failed');
          }
        }),
        switchMap(() => this.getResources()),
      )
      .subscribe();
  }

  private mergeExistingAndSelectedLabels(classifications: Classification[] | undefined): Classification[] {
    if (!classifications) {
      return this.currentLabelList;
    }
    return deDuplicateList(
      classifications.concat(this.currentLabelList.map((label) => ({ ...label, cancelled_by_user: false }))),
    );
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.cdr?.markForCheck();
  }

  displayStatus(status: ResourceStatus) {
    this.statusDisplayed.next(status);
    this.getResources().subscribe();
  }

  private getResourceStatusCount(): Observable<{ pending: number; error: number }> {
    const statusFacet = '/n/s';
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.search('', [Search.Features.DOCUMENT], {
          faceted: [statusFacet],
        }),
      ),
      map((results) => ({
        pending: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/PENDING`] || 0,
        error: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/ERROR`] || 0,
      })),
    );
  }

  private updateStatusCount() {
    this.getResourceStatusCount()
      .pipe(tap((count) => this._statusCount.next(count)))
      .subscribe();
  }
}
