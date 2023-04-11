import { Directive, EventEmitter, inject, Input, Output } from '@angular/core';
import { BulkAction, ColumnHeader, MenuAction, ResourceWithLabels } from './resource-list.model';
import { Resource, SortField, SortOption } from '@nuclia/core';
import { map } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import { combineLatest, Observable } from 'rxjs';

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
export class ResourcesTableDirective {
  @Input()
  set data(value: ResourceWithLabels[] | undefined | null) {
    if (value) {
      this._data = value;
    }
  }
  get data(): ResourceWithLabels[] {
    return this._data;
  }

  @Input()
  set sorting(value: SortOption | undefined | null) {
    this._sorting = value;
  }
  get sorting() {
    return this._sorting;
  }

  @Input()
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

  @Input()
  set selection(value: string[] | undefined | null) {
    if (value) {
      this._selection = value;
    }
  }
  get selection(): string[] {
    return this._selection;
  }

  get allSelected(): boolean {
    return this.selection.length > 0 && this.selection.length === this.data.length;
  }

  @Output() loadMore: EventEmitter<void> = new EventEmitter();
  @Output() sort: EventEmitter<SortOption> = new EventEmitter();
  @Output() clickOnTitle: EventEmitter<{ resource: Resource }> = new EventEmitter();
  @Output() deleteResources: EventEmitter<Resource[]> = new EventEmitter();
  @Output() menuAction: EventEmitter<{ resource: Resource; action: MenuAction }> = new EventEmitter();
  @Output() reprocessResources: EventEmitter<Resource[]> = new EventEmitter();
  @Output() selectionChange: EventEmitter<string[]> = new EventEmitter();

  private _bulkAction: BulkAction = {
    inProgress: false,
    total: 0,
    done: 0,
    label: '',
  };
  private _data: ResourceWithLabels[] = [];
  private _selection: string[] = [];
  private _sorting?: SortOption | null;

  protected sdk: SDKService = inject(SDKService);
  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => this.sdk.nuclia.options.standalone || !!kb.admin || !!kb.contrib));

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
    this.loadMore.emit();
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
        this.sort.emit(sorting);
        break;
    }
  }

  triggerAction(resource: Resource, action: MenuAction) {
    this.menuAction.emit({ resource, action });
  }

  onClickTitle(resource: Resource) {
    this.clickOnTitle.emit({ resource });
  }

  bulkDelete() {
    const resources = this.getSelectedResources();
    this.deleteResources.emit(resources);
  }

  bulkReprocess() {
    const resources = this.getSelectedResources();
    this.reprocessResources.emit(resources);
  }

  toggleAll() {
    if (this.allSelected) {
      this.selection = [];
    } else {
      this.selection = this.data.map((row) => row.resource.id);
    }
    this.selectionChange.emit(this.selection);
  }

  toggleSelection(resourceId: string) {
    if (this.selection.includes(resourceId)) {
      this.selection = this.selection.filter((id) => id !== resourceId);
    } else {
      this.selection = this.selection.concat([resourceId]);
    }
    this.selectionChange.emit(this.selection);
  }

  protected getSelectedResources(): Resource[] {
    return this.data.filter((row) => this.selection.includes(row.resource.id)).map((row) => row.resource);
  }
}
