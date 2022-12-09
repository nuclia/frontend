import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
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
import { debounceTime, filter, map, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Classification,
  deDuplicateList,
  Resource,
  RESOURCE_STATUS,
  resourceToAlgoliaFormat,
  Search,
} from '@nuclia/core';
import { BackendConfigurationService, SDKService, StateService, STFUtils } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { DomSanitizer } from '@angular/platform-browser';
import { ResourceViewerService } from './resource-viewer.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateLinkComponent } from '../upload/create-link/create-link.component';
import { UploadFilesDialogComponent } from '../upload/upload-files/upload-files-dialog.component';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';

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
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements AfterViewInit, OnInit, OnDestroy {
  data: ResourceWithLabels[] | undefined;
  resultsLength = 0;
  isLoading = true;
  selection = new SelectionModel<Resource>(true, []);
  filterTitle: UntypedFormControl;
  unsubscribeAll = new Subject<void>();
  refreshing = true;
  statusTooltips: { [resourceId: string]: string } = {};

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
    { value: 'title', label: 'resource.title', visible: true },
    { value: 'classification', label: 'resource.classification', visible: false, optional: true },
    { value: 'modification', label: 'generic.date', visible: true, optional: true },
    { value: 'status', label: 'resource.status', visible: true },
    { value: 'language', label: 'generic.language', visible: true, optional: true },
  ];
  columnVisibilityUpdate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  optionalColumns = this.columns.filter((column) => column.optional);
  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  displayedColumns = combineLatest([this.isAdminOrContrib, this.columnVisibilityUpdate]).pipe(
    map((canEdit) => {
      const columns = this.columns
        .map((column) => (!column.optional || column.visible ? column.value : ''))
        .filter((column) => !!column);

      return canEdit ? ['select', ...columns, 'actions'] : columns;
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
        lang="${this.translation.currentLang}"
      ></nuclia-viewer>`);
    }),
  );

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
    private translation: TranslateService,
    private backendConfig: BackendConfigurationService,
    private resourceViewer: ResourceViewerService,
    private dialog: MatDialog, //FIXME replace old upload dialog with sistema modal service
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
    this.route.queryParams
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(() => this.getResources()),
      )
      .subscribe();

    this.sdk.counters.pipe(takeUntil(this.unsubscribeAll)).subscribe((counters) => {
      this.resultsLength = counters.resources;
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

  uploadLink() {
    this.dialog.open(CreateLinkComponent);
  }

  uploadFiles(folderMode = false) {
    this.dialog.open(UploadFilesDialogComponent, {
      data: { folderMode: folderMode },
    });
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
    resource.reprocess().subscribe();
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

  setStatus(status: KeyValue) {
    this.applyFilter({
      status: status ? status.key : undefined,
    });
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
    this.router.navigate(['.'], {
      queryParams: params,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }

  getResources(): Observable<Search.Results> {
    const page = this.page >= 1 ? this.page - 1 : 0;
    return of(1).pipe(
      tap(() => {
        this.setLoading(true);
      }),
      switchMap(() => this.sdk.currentKb),
      switchMap((kb) =>
        forkJoin([
          of(kb),
          kb.search('', [Search.Features.DOCUMENT], {
            inTitleOnly: true,
            page_number: page,
            page_size: this.pageSize,
            sort: 'created',
          }),
          this.labelSets$.pipe(take(1)),
        ]),
      ),
      map(([kb, results, labelSets]) => {
        this.data = Object.values(results.resources || {}).map((resourceData) => {
          const resource = new Resource(this.sdk.nuclia, kb.id, resourceData);
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
          return resourceWithLabels;
        });
        this.clearSelected();
        this.setLoading(false);
        return results;
      }),
      tap((results) => {
        this.statusTooltips = Object.values(results.resources || {}).reduce((status, resource) => {
          const key =
            resource.metadata?.status && resource.metadata.status !== RESOURCE_STATUS.PENDING
              ? resource.metadata.status.toLocaleLowerCase()
              : 'loading';
          status[resource.id] = this.translate.instant(`resource.status_${key}`);
          return status;
        }, {} as { [resourceId: string]: string });
      }),
    );
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.cdr?.markForCheck();
  }

  downloadAlgoliaJson(resource: Resource) {
    this.sdk.currentKb.pipe(switchMap((kb) => kb.getResource(resource.uuid))).subscribe((fullResource) => {
      const formatted = resourceToAlgoliaFormat(fullResource, this.sdk.nuclia.regionalBackend);
      STFUtils.downloadJson(formatted, `algolia_record.json`);
    });
  }

  getProcessingStatus(resource: Resource) {
    if (resource.metadata?.status === RESOURCE_STATUS.PENDING) {
      this.sdk.nuclia.db.getProcessingStatus(this.stateService.getAccount()?.id).subscribe((status) => {
        const last_delivered_seqid =
          resource.queue === 'private' ? status.account?.last_delivered_seqid : status.shared?.last_delivered_seqid;
        if (last_delivered_seqid && resource.last_account_seq !== undefined) {
          const count = resource.last_account_seq - last_delivered_seqid;
          const statusKey = count > 0 ? 'resource.status_pending' : 'resource.status_processing';
          this.statusTooltips[resource.id] = this.translate.instant(statusKey, { count });
        } else {
          this.statusTooltips[resource.id] = this.translate.instant('resource.status_unknown');
        }
        this.cdr.detectChanges();
      });
    }
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

  private mergeExistingAndSelectedLabels(classifications: Classification[] | undefined): Classification[] {
    if (!classifications) {
      return this.currentLabelList;
    }
    return deDuplicateList(
      classifications.concat(this.currentLabelList.map((label) => ({ ...label, cancelled_by_user: false }))),
    );
  }
}
