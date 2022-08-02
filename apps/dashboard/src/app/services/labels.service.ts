import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, filter, tap, take, map, catchError, EMPTY } from 'rxjs';
import { SDKService } from '@flaps/core';
import { Labels, LabelSet, LabelSetKind } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private _labelsSubject = new BehaviorSubject<Labels | null>(null);
  labels = this._labelsSubject.asObservable();

  constructor(private sdk: SDKService) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this._labelsSubject.next(null);
        }),
        filter((kb) => !!kb),
        switchMap(() => this.refreshLabelsSets()),
      )
      .subscribe();
  }

  getLabelsByKind(kind: LabelSetKind): Observable<Labels | null> {
    return this.labels.pipe(
      map((labels) => {
        if (!labels) {
          return labels;
        } else {
          const filtered: Labels = {};
          Object.entries(labels).forEach(([key, labelSet]) => {
            if (labelSet.kind.length === 0 || labelSet.kind.includes(kind)) {
              filtered[key] = labelSet;
            }
          });
          return filtered;
        }
      }),
    );
  }

  refreshLabelsSets(): Observable<Labels> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getLabels()),
      catchError(() => {
        this._labelsSubject.next(null);
        return EMPTY;
      }),
      tap((labels) => {
        this._labelsSubject.next(labels);
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
