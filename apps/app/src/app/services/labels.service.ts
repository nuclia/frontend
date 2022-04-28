import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, filter, tap, take } from 'rxjs';
import { SDKService } from '@flaps/auth';
import { Labels, LabelSet } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  labelsSubject = new BehaviorSubject<Labels | null>(null);

  constructor(private sdk: SDKService) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this.labelsSubject.next(null);
        }),
        filter((kb) => !!kb),
        switchMap(() => this.refreshLabelsSets()),
      )
      .subscribe();
  }

  getLabels(): Observable<Labels | null> {
    return this.labelsSubject.asObservable();
  }

  refreshLabelsSets(): Observable<Labels> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getLabels()),
      tap((labels) => {
        this.labelsSubject.next(labels);
      }),
    );
  }

  saveLabelSet(setId: string, labelSet: LabelSet) {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.setLabelSet(setId, labelSet)));
  }

  deleteLabelSet(setId: string) {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.deleteLabelSet(setId)));
  }
}
