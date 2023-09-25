import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { EMPTY, expand, map, Observable, reduce, take } from 'rxjs';
import { IErrorResponse, IResource, KnowledgeBox, Resource, RESOURCE_STATUS, Search } from '@nuclia/core';
import { switchMap, tap } from 'rxjs/operators';
import { DEFAULT_PAGE_SIZE, DEFAULT_SORTING } from '../resource-list.model';
import { UploadService } from '../../../upload/upload.service';

@Component({
  selector: 'stf-error-resources-table',
  templateUrl: './error-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorResourcesTableComponent extends ResourcesTableDirective {
  private uploadService = inject(UploadService);
  override status: RESOURCE_STATUS = RESOURCE_STATUS.ERROR;

  get errorCount(): Observable<number> {
    return this.uploadService.statusCount.pipe(map((statusCount) => statusCount.error));
  }

  allErrorsSelected = false;

  selectAllErrors() {
    this.allErrorsSelected = true;
  }

  clearSelection() {
    this.allErrorsSelected = false;
    this.selection = [];
  }

  override bulkDelete() {
    const resourcesObs = this.allErrorsSelected ? this.getAllResourcesInError() : this.getSelectedResources();
    resourcesObs.pipe(switchMap((resources) => this.delete(resources))).subscribe();
  }

  override bulkReprocess() {
    const resourcesObs = this.allErrorsSelected ? this.getAllResourcesInError() : this.getSelectedResources();
    resourcesObs.pipe(switchMap((resources) => this.reprocess(resources))).subscribe(() => {
      if (this.allErrorsSelected) {
        this.toaster.info('resource.reindex-all-info');
      }
    });
  }

  private getAllResourcesInError(): Observable<Resource[]> {
    this.isLoading = true;
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
      tap(() => (this.isLoading = false)),
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
