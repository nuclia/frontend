import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectionModel } from '@angular/cdk/collections';
import { BehaviorSubject, combineLatest, forkJoin, from, mergeMap, Observable, of, Subject, take } from 'rxjs';
import { debounceTime, filter, map, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { LabelValue, Resource, RESOURCE_STATUS, ResourceList, resourceToAlgoliaFormat } from '@nuclia/core';
import { SDKService, StateService, STFUtils } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';

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

interface ColoredLabel extends LabelValue {
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
export class ResourceListComponent implements OnInit, OnDestroy {
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

  constructor(
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
    private stateService: StateService,
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
    (document.getElementById('search-widget') as unknown as any)?.displayResource(resourceId);
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

  getResources(): Observable<ResourceList> {
    const page = this.page >= 1 ? this.page - 1 : 0;
    return of(1).pipe(
      tap(() => {
        this.setLoading(true);
      }),
      switchMap(() => this.sdk.currentKb),
      switchMap((kb) => forkJoin([kb.listResources(page, this.pageSize), this.labelSets$.pipe(take(1))])),
      map(([results, labelSets]) => {
        this.data = results.resources.map((resource: Resource) => {
          const resourceWithLabels: ResourceWithLabels = {
            resource,
            labels: [],
          };
          if (resource.usermetadata?.classifications) {
            resourceWithLabels.labels = resource.usermetadata.classifications.map((label) => ({
              ...label,
              color: labelSets[label.labelset].color,
            }));
          }
          return resourceWithLabels;
        });
        this.clearSelected();
        this.setLoading(false);
        return results;
      }),
      tap((results) => {
        this.statusTooltips = results.resources.reduce((status, resource) => {
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
        if (status.last_delivered_seqid) {
          const count = resource.last_seqid - status.last_delivered_seqid;
          const statusKey = count > 0 ? 'resource.status_pending' : 'resource.status_processing';
          this.statusTooltips[resource.id] = this.translate.instant(statusKey, { count });
        } else {
          this.statusTooltips[resource.id] = this.translate.instant('resource.status_unknown');
        }
        this.cdr.detectChanges();
      });
    }
  }
}
