import { ChangeDetectorRef, Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { BulkAction, ColumnHeader, MenuAction } from './resource-list.model';
import { Resource, RESOURCE_STATUS, SortField, SortOption } from '@nuclia/core';
import { delay, map, switchMap } from 'rxjs/operators';
import { FeaturesService, SDKService } from '@flaps/core';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  from,
  mergeMap,
  Observable,
  of,
  take,
  tap,
  toArray,
} from 'rxjs';
import { ResourceListService } from './resource-list.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';

export const COMMON_COLUMNS = [
  { id: 'title', label: 'resource.title', size: '3fr', sortable: false },
  {
    id: 'created',
    label: 'generic.date',
    size: '128px',
    centered: true,
    sortable: true,
  },
];

@Directive({
  selector: '[stfResourcesTable]',
})
export class ResourcesTableDirective implements OnInit, OnDestroy {
  protected resourceListService = inject(ResourceListService);
  protected sdk: SDKService = inject(SDKService);
  protected cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected modalService = inject(SisModalService);
  protected toaster = inject(SisToastService);
  protected translate = inject(TranslateService);
  protected features = inject(FeaturesService);

  // status is set to processed by default, but will be overridden by each component extending this directive
  status: RESOURCE_STATUS = RESOURCE_STATUS.PROCESSED;
  data = this.resourceListService.data;
  sorting = this.resourceListService.sort;
  isAdminOrContrib = this.sdk.isAdminOrContrib;

  isSummarizationEnabled = this.features.summarization;

  private _selection = new BehaviorSubject<string[]>([]);
  set selection(selection: string[]) {
    this._selection.next(selection);
  }
  get selection(): string[] {
    return this._selection.value;
  }

  allSelected = combineLatest([this.data, this._selection]).pipe(
    map(([data, selection]) => data.length > 0 && selection.length === data.length),
  );
  isLoading = false;
  isShardReady = new BehaviorSubject<boolean>(false);

  private _bulkAction: BulkAction = {
    inProgress: false,
    total: 0,
    done: 0,
    errors: 0,
    label: '',
  };
  set bulkAction(value: BulkAction | undefined | null) {
    if (value) {
      // Reset selection when bulk action is done
      if (this._bulkAction.inProgress && !value.inProgress) {
        this.selection = [];
      }
      this._bulkAction = value;
    }
  }
  get bulkAction(): BulkAction {
    return this._bulkAction;
  }

  protected defaultColumns: ColumnHeader[] = COMMON_COLUMNS;
  columns: Observable<ColumnHeader[]> = this.isAdminOrContrib.pipe(
    map((canEdit) => {
      const columns = this.defaultColumns.map(this.getApplySortingMapper());
      return canEdit ? [...columns, { id: 'menu', label: 'generic.actions', size: '96px' }] : [...columns];
    }),
  );
  headerCells: Observable<HeaderCell[]> = this.columns.pipe(map((cells) => cells.map((cell) => new HeaderCell(cell))));
  tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this.columns]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );

  ngOnInit() {
    this.resourceListService.status = this.status;
    this.resourceListService.loadResources().subscribe(() => {
      // loadResources is launching the first `/catalog` request which will set the shard.
      // we need to wait for it to be done before launching other request to prevent using different shards for different requests
      this.isShardReady.next(true);
    });
  }

  ngOnDestroy() {
    this.resourceListService.clear();
  }

  protected getApplySortingMapper() {
    return (column: ColumnHeader) => {
      if (this.sorting && column.id === this.sorting.field) {
        column.active = true;
        column.descending = this.sorting.order ? this.sorting.order === 'desc' : true;
      }
      return column;
    };
  }

  onLoadMore() {
    this.resourceListService.loadMore();
  }

  sortBy(cell: HeaderCell) {
    switch (cell.id) {
      case SortField.title:
      case SortField.created:
      case SortField.modified:
        const sorting: SortOption = {
          field: cell.id,
          order: cell.descending ? 'desc' : 'asc',
        };
        this.resourceListService.sortBy(sorting);
        break;
    }
  }

  onClickTitle(resource: Resource) {
    this.router.navigate([`../${resource.id}/edit/preview`], { relativeTo: this.route });
  }

  triggerAction(resource: Resource, action: MenuAction) {
    const resourceId = resource.id;
    switch (action) {
      case 'annotate':
        this.router.navigate([`../${resourceId}/edit/annotation`], { relativeTo: this.route });
        break;
      case 'edit':
        this.router.navigate([`../${resourceId}/edit`], { relativeTo: this.route });
        break;
      case 'classify':
        this.router.navigate([`../${resourceId}/edit/classification`], { relativeTo: this.route });
        break;
      case 'delete':
        this.delete([resource]).subscribe();
        break;
      case 'reprocess':
        this.reprocess([resource]).subscribe();
        break;
      case 'summarize':
        this.summarize(resource).subscribe();
        break;
    }
  }

  summarize(resource: Resource) {
    const avoidTabClosing = (event: BeforeUnloadEvent) => event.preventDefault();
    return this.modalService
      .openConfirm({
        title: 'resource.confirm-summarize.title',
        description: 'resource.confirm-summarize.description',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        tap(() => window.addEventListener('beforeunload', avoidTabClosing)),
        switchMap((kb) => kb.summarize([resource.id])),
        switchMap((summary) => resource.modify({ summary })),
        tap(() => window.removeEventListener('beforeunload', avoidTabClosing)),
      );
  }

  delete(resources: Resource[]) {
    const title = resources.length > 1 ? 'resource.confirm-delete.plural-title' : 'resource.confirm-delete.title';
    const message =
      resources.length > 1 ? 'resource.confirm-delete.plural-description' : 'resource.confirm-delete.description';
    return this.modalService
      .openConfirm({
        title,
        description: message,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        tap(() => {
          this.isLoading = true;
          if (resources.length > 1) {
            this.bulkAction = {
              inProgress: true,
              done: 0,
              errors: 0,
              total: resources.length,
              label: 'generic.deleting',
            };
            this.cdr.markForCheck();
          }
        }),
        switchMap(() => from(resources.map((resource) => this.updateBulkAction(resource.delete())))),
        mergeMap((obs) => obs, 6),
        toArray(),
        delay(1000),
        switchMap(() => this.resourceListService.loadResources()),
        tap(() => {
          this.manageBulkActionResults('deleting');
          this.sdk.refreshCounter(true);
          this.cdr.markForCheck();
        }),
      );
  }

  bulkDelete() {
    this.getSelectedResources()
      .pipe(switchMap((resources) => this.delete(resources)))
      .subscribe();
  }

  reprocess(resources: Resource[]) {
    const wait: number = this.status === RESOURCE_STATUS.ERROR ? 2000 : 1000;
    const title = resources.length > 1 ? 'resource.confirm-reprocess.plural-title' : 'resource.confirm-reprocess.title';
    const description =
      resources.length > 1 ? 'resource.confirm-reprocess.plural-description' : 'resource.confirm-reprocess.description';

    return this.modalService
      .openConfirm({
        title,
        description,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        tap((yes) => {
          this.isLoading = true;
          if (resources.length > 1) {
            this.bulkAction = {
              inProgress: true,
              done: 0,
              errors: 0,
              total: resources.length,
              label: 'generic.reindexing',
            };
            this.cdr.markForCheck();
          }
        }),
        switchMap(() => from(resources.map((resource) => this.updateBulkAction(resource.reprocess())))),
        mergeMap((obs) => obs, 6),
        toArray(),
        delay(wait),
        switchMap(() => this.resourceListService.loadResources()),
        tap(() => {
          this.manageBulkActionResults('reprocessing');
          this.sdk.refreshCounter(true);
          this.cdr.markForCheck();
        }),
      );
  }

  bulkReprocess() {
    this.getSelectedResources()
      .pipe(switchMap((resources) => this.reprocess(resources)))
      .subscribe();
  }

  toggleAll() {
    forkJoin([this.allSelected.pipe(take(1)), this.data.pipe(take(1))]).subscribe(([allSelected, rows]) => {
      this.selection = allSelected ? [] : rows.map((row) => row.resource.id);
      this.cdr.detectChanges();
    });
  }

  toggleSelection(resourceId: string) {
    if (this.selection.includes(resourceId)) {
      this.selection = this.selection.filter((id) => id !== resourceId);
    } else {
      this.selection = this.selection.concat([resourceId]);
    }
  }

  protected getSelectedResources(): Observable<Resource[]> {
    return this.data.pipe(
      take(1),
      map((data) => data.filter((row) => this.selection.includes(row.resource.id)).map((row) => row.resource)),
    );
  }

  private updateBulkAction(observable: Observable<void>): Observable<any> {
    return observable.pipe(
      tap(() => {
        this.bulkAction = {
          ...this.bulkAction,
          done: this.bulkAction.done + 1,
        };
        this.cdr.markForCheck();
      }),
      catchError(() => {
        this.bulkAction = {
          ...this.bulkAction,
          errors: this.bulkAction.errors + 1,
        };
        return of(null);
      }),
    );
  }

  private manageBulkActionResults(action: 'reprocessing' | 'deleting') {
    if (this.bulkAction.errors > 0) {
      const message = this.translate.instant(
        this.bulkAction.errors > 1 ? `error.${action}-resources` : `error.${action}-resource`,
        { count: this.bulkAction.errors },
      );
      this.toaster.error(message);
    } else {
      this.selection = [];
    }
    this.afterBulkActions();
  }

  private afterBulkActions() {
    this.isLoading = false;
    this.bulkAction = { inProgress: false, total: 0, done: 0, errors: 0, label: '' };
    this.cdr.markForCheck();
  }
}
