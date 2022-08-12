import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin, from, mergeMap, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, map, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { STFConfirmComponent } from '@flaps/components';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource, RESOURCE_STATUS, ResourceList, resourceToAlgoliaFormat } from '@nuclia/core';
import { SDKService, STFUtils } from '@flaps/core';

interface ListFilters {
  type?: string;
  title?: string;
  status?: string;
  page?: string;
  size?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

const STATUS_LIST: RESOURCE_STATUS[] = [RESOURCE_STATUS.PENDING, RESOURCE_STATUS.PROCESSED, RESOURCE_STATUS.ERROR];

interface KeyValue {
  key: string;
  value: string;
}

interface TypeOption {
  key: string;
  label?: string;
  mime: string[];
}

const TYPE_FILTER_OPTIONS: TypeOption[] = [
  { key: '.pdf', mime: ['application/pdf'] },
  {
    key: '.xls',
    mime: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  { key: '.mp4', mime: ['video/mp4'] },
  { key: '.jpg', mime: ['image/jpeg'] },
  {
    key: '.doc',
    mime: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  {
    key: '.ppt',
    mime: [
      'application/powerpoint',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements OnInit, OnDestroy {
  // prettier-ignore
  data: Resource[] | undefined;
  resultsLength = 0;
  isLoading = true;
  selection = new SelectionModel<Resource>(true, []);
  filterTitle: UntypedFormControl;
  unsubscribeAll = new Subject<void>();
  refreshing = true;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FIXME: those options are not used anywhere, can we remove them or is there a reason to keep them here?
  statusOptions = STATUS_LIST.map((status) => ({
    key: status,
    value: status.charAt(0).toUpperCase() + status.slice(1),
    icon: this.getStatusIcon(status),
  }));

  typeOptions = TYPE_FILTER_OPTIONS.map((type: TypeOption) => ({
    key: type.key,
    value: type.label ? this.translate.instant(type.label) : type.key,
  }));

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  pageSizeOptions: Observable<KeyValue[]> = forkJoin(
    PAGE_SIZE_OPTIONS.map((size) =>
      of(size.toString()).pipe(
        switchMap((size) =>
          this.translate
            .get('resource.resource_number', { num: size })
            .pipe(map((text) => ({ key: size, value: text }))),
        ),
      ),
    ),
  );

  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  displayedColumns = this.isAdminOrContrib.pipe(
    map((canEdit) => {
      const columns = ['icon', 'title', 'modification', 'status', 'language'];
      return canEdit ? ['select', ...columns, 'actions'] : columns;
    }),
  );

  constructor(
    public dialog: MatDialog,
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
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
    const message = resources.length > 1 ? 'resource.delete_resources_warning' : 'resource.delete_resource_warning';
    this.dialog
      .open(STFConfirmComponent, {
        width: '470px',
        data: {
          title: 'generic.alert',
          message: message,
          minWidthButtons: '120px',
        },
      })
      .afterClosed()
      .pipe(
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
    return page ? parseInt(page, 10) : 1;
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
    this.isAllSelected() ? this.selection.clear() : this.data?.forEach((row) => this.selection.select(row));
    this.cdr?.markForCheck();
  }

  clearSelected() {
    this.selection.clear();
    this.cdr?.markForCheck();
  }

  getCheckboxLabel(row?: Resource): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  getStatusIcon(status: RESOURCE_STATUS) {
    return `assets/icons/status-${status.toLowerCase()}.svg`;
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
    return of(1).pipe(
      tap(() => {
        this.setLoading(true);
      }),
      switchMap(() => this.sdk.currentKb),
      switchMap((kb) => kb.listResources(this.page - 1, this.pageSize)),
      tap((results) => {
        this.data = results.resources.map((res) => Object.assign(res, { title: this.formatTitle(res.title) }));
        this.clearSelected();
        this.setLoading(false);
      }),
    );
  }

  private formatTitle(title?: string): string {
    title = title || '–';
    try {
      return decodeURIComponent(title);
    } catch (e) {
      return title;
    }
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
}
