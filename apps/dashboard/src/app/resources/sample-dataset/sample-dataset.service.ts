import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Resource, Search } from '@nuclia/core';
import { LabelsService } from '../../services/labels.service';

const sampleLabelSet = 'dataset';
const sampleLabel = 'Sample dataset';

@Injectable({
  providedIn: 'root',
})
export class SampleDatasetService {
  private refresh = new BehaviorSubject<boolean>(false);

  constructor(private sdkService: SDKService, private labelService: LabelsService) {}

  hasSampleResources(): Observable<boolean> {
    return this.refresh.pipe(
      switchMap(() => this.getSampleResources()),
      map((resources) => resources.length > 0),
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
          this.refresh.next(true);
        }
      }),
    );
  }

  private cleanupSampleLabelSet() {
    this.sdkService.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.deleteLabelSet(sampleLabelSet)),
        switchMap(() => this.labelService.refreshLabelsSets()),
      )
      .subscribe();
  }

  private getSampleResources(): Observable<Resource[]> {
    return this.sdkService.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .search('', [Search.Features.DOCUMENT], { filters: [`/l/${sampleLabelSet}/${sampleLabel}`], page_size: 20 })
          .pipe(
            map((results: Search.Results) =>
              Object.values(results.resources || {}).map(
                (resource) => new Resource(this.sdkService.nuclia, kb.id, resource),
              ),
            ),
          ),
      ),
    );
  }
}
