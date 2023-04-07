import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { IErrorResponse, Resource, Search } from '@nuclia/core';
import { LabelsService } from '../../label/labels.service';

const sampleLabelSet = 'dataset';
const sampleLabel = 'Sample dataset';

@Injectable({
  providedIn: 'root',
})
export class SampleDatasetService {
  private refresh = new BehaviorSubject<boolean>(false);

  constructor(private sdk: SDKService, private labelService: LabelsService) {}

  hasSampleResources(): Observable<boolean> {
    return this.refresh.pipe(switchMap(() => this.labelService.hasLabel(sampleLabelSet, sampleLabel)));
  }

  importDataset(sampleId: string): Observable<void> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => this.sdk.nuclia.rest.post(`/export/${sampleId}/import_to/${kb.id}`, {})),
      switchMap(() => this.labelService.refreshLabelsSets()),
      map(() => {
        this.refresh.next(true);
      }),
    );
  }

  // non-documented API so we keep it out of the SDK
  getDatasets(): Observable<{ id: string; title: string; description: string }[]> {
    return this.sdk.currentKb.pipe(
      switchMap(() => this.sdk.nuclia.rest.get<{ id: string; title: string; description: string }[]>(`/exports`)),
    );
  }

  deleteSampleDataset(): Observable<{ success: number; error: number }> {
    return this.getSampleResources().pipe(
      switchMap((sampleResources: Resource[]) =>
        forkJoin(
          sampleResources.map((resource) =>
            resource.delete(true).pipe(
              map(() => ({ success: true })),
              catchError(() => of({ success: false })),
            ),
          ),
        ),
      ),
      map((results) =>
        results.reduce(
          (count, status) => {
            if (status.success) {
              count.success += 1;
            } else {
              count.error += 1;
            }
            return count;
          },
          { success: 0, error: 0 },
        ),
      ),
      tap((count) => {
        if (count.error === 0) {
          this.cleanupSampleLabelSet();
        }
      }),
    );
  }

  private cleanupSampleLabelSet() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.deleteLabelSet(sampleLabelSet)),
        switchMap(() => this.labelService.refreshLabelsSets()),
      )
      .subscribe(() => this.refresh.next(true));
  }

  private getSampleResources(): Observable<Resource[]> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .search('', [Search.Features.DOCUMENT], { filters: [`/l/${sampleLabelSet}/${sampleLabel}`], page_size: 20 })
          .pipe(
            map((results: Search.Results | IErrorResponse) => {
              if (results.type === 'error') {
                return [];
              }
              return Object.values(results.resources || {}).map(
                (resource) => new Resource(this.sdk.nuclia, kb.id, resource),
              );
            }),
          ),
      ),
    );
  }
}
