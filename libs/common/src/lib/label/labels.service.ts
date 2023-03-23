import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilKeyChanged,
  EMPTY,
  filter,
  map,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { SDKService } from '@flaps/core';
import { LabelSet, LabelSetKind, LabelSets } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private _labelsSubject = new BehaviorSubject<LabelSets | null>(null);
  labelSets = this._labelsSubject.asObservable();

  constructor(private sdk: SDKService) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this._labelsSubject.next(null);
        }),
        filter((kb) => !!kb),
        distinctUntilKeyChanged('id'),
        switchMap(() => this.refreshLabelsSets()),
      )
      .subscribe();
  }

  hasLabelSets(): Observable<boolean> {
    return this.labelSets.pipe(
      take(1),
      map((sets) => !!sets && Object.keys(sets).length > 0),
    );
  }

  hasLabel(setId: string, labelName: string): Observable<boolean> {
    return this.labelSets.pipe(
      filter((sets) => !!sets),
      take(1),
      map((sets) =>
        Object.entries(sets as LabelSets).some(
          ([key, value]) => key === setId && value.labels.some((label) => label.title === labelName),
        ),
      ),
    );
  }

  getLabelsByKind(kind: LabelSetKind): Observable<LabelSets | null> {
    return this.labelSets.pipe(
      map((labels) => {
        if (!labels) {
          return labels;
        } else {
          const filtered: LabelSets = {};
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

  refreshLabelsSets(): Observable<LabelSets> {
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
