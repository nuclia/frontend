import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { ColumnHeader } from '../resource-list.model';
import { combineLatest, EMPTY, expand, map, Observable, of, reduce, take } from 'rxjs';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import { IResource, KnowledgeBox, Resource, RESOURCE_STATUS, Search } from '@nuclia/core';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'stf-error-resources-table',
  templateUrl: './error-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorResourcesTableComponent extends ResourcesTableDirective {
  @Input()
  set errorCount(value: number | null | undefined) {
    if (typeof value === 'number') {
      this._errorCount = value;
    }
  }
  get errorCount(): number {
    return this._errorCount;
  }
  @Output() isLoading: EventEmitter<boolean> = new EventEmitter();

  private _errorCount = 0;
  private defaultColumns: ColumnHeader[] = [
    { id: 'title', label: 'resource.title', size: '3fr' },
    {
      id: 'modification',
      label: 'generic.date',
      size: '128px',
      centered: true,
    },
  ];
  columns: Observable<ColumnHeader[]> = this.isAdminOrContrib.pipe(
    map((canEdit) =>
      canEdit
        ? [...this.defaultColumns, { id: 'menu', label: 'generic.actions', size: '96px' }]
        : [...this.defaultColumns],
    ),
  );
  headerCells: Observable<HeaderCell[]> = this.columns.pipe(map((cells) => cells.map((cell) => new HeaderCell(cell))));
  tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this.columns]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );

  allErrorsSelected = false;

  selectAllErrors() {
    this.allErrorsSelected = true;
  }

  clearSelection() {
    this.allErrorsSelected = false;
    this.selection = [];
  }

  override bulkDelete() {
    const resourcesObs = this.allErrorsSelected ? this.getAllResourcesInError() : of(this.getSelectedResources());
    resourcesObs.subscribe((resources) => this.deleteResources.emit(resources));
  }

  override bulkReprocess() {
    const resourcesObs = this.allErrorsSelected ? this.getAllResourcesInError() : of(this.getSelectedResources());
    resourcesObs.subscribe((resources) => this.reprocessResources.emit(resources));
  }

  private getAllResourcesInError(): Observable<Resource[]> {
    this.isLoading.emit(true);
    let kb: KnowledgeBox;
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((current) => {
        kb = current;
        return this.getResourcesInError(kb);
      }),
      expand((results) =>
        results.fulltext?.next_page ? this.getResourcesInError(kb, results.fulltext?.page_number + 1) : EMPTY,
      ),
      map((results) => {
        return Object.values(results.resources || {}).map(
          (resourceData: IResource) => new Resource(this.sdk.nuclia, kb.id, resourceData),
        );
      }),
      reduce((accData, data) => accData.concat(data), [] as Resource[]),
      tap(() => this.isLoading.emit(false)),
    );
  }

  private getResourcesInError(kb: KnowledgeBox, page_number = 0): Observable<Search.Results> {
    return kb.catalog('', {
      page_number,
      page_size: 20,
      sort: { field: 'created' },
      filters: [`/n/s/${RESOURCE_STATUS.ERROR}`],
    });
  }
}
