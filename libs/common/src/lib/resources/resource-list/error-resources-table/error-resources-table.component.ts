import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { EMPTY, expand, map, Observable, of, reduce, take } from 'rxjs';
import { IErrorResponse, IResource, KnowledgeBox, Resource, RESOURCE_STATUS, Search } from '@nuclia/core';
import { switchMap, tap } from 'rxjs/operators';
import { DEFAULT_PAGE_SIZE, DEFAULT_SORTING } from '../resource-list.model';
import { SisToastService } from '@nuclia/sistema';

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
  @Output() reprocessAll: EventEmitter<Resource[]> = new EventEmitter();

  private _errorCount = 0;
  allErrorsSelected = false;

  constructor(private toaster: SisToastService) {
    super();
  }

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
    resourcesObs.subscribe((resources) => {
      if (this.allErrorsSelected) {
        this.reprocessAll.emit(resources);
        this.toaster.info('resource.reindex-all-info');
      } else {
        this.reprocessResources.emit(resources);
      }
    });
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
        results.type !== 'error' && results.fulltext?.next_page
          ? this.getResourcesInError(kb, results.fulltext?.page_number + 1)
          : EMPTY,
      ),
      map((results) => {
        return results.type === 'error'
          ? []
          : Object.values(results.resources || {}).map(
              (resourceData: IResource) => new Resource(this.sdk.nuclia, kb.id, resourceData),
            );
      }),
      reduce((accData, data) => accData.concat(data), [] as Resource[]),
      tap(() => this.isLoading.emit(false)),
    );
  }

  private getResourcesInError(kb: KnowledgeBox, page_number = 0): Observable<Search.Results | IErrorResponse> {
    return kb.catalog('', {
      page_number,
      page_size: DEFAULT_PAGE_SIZE,
      sort: this.sorting || DEFAULT_SORTING,
      filters: [`/n/s/${RESOURCE_STATUS.ERROR}`],
    });
  }
}
