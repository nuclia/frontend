import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilKeyChanged, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import { SDKService } from '@flaps/core';
import { LabelSet, LabelSetKind, LabelSets } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private _labelsSubject = new BehaviorSubject<LabelSets | null>(null);
  labelSets = this._labelsSubject.asObservable();
  resourceLabelSets = this.labelSets.pipe(
    filter((labels) => !!labels),
    map((labels) => this.filterByKind(labels, LabelSetKind.RESOURCES)),
  );
  paragraphLabelSets = this.labelSets.pipe(
    filter((labels) => !!labels),
    map((labels) => this.filterByKind(labels, LabelSetKind.PARAGRAPHS)),
  );
  hasLabelSets = this.labelSets.pipe(map((sets) => !!sets && Object.keys(sets).length > 0));

  constructor(private sdk: SDKService) {
    this.sdk.currentKb
      .pipe(
        filter((kb) => !!kb),
        distinctUntilKeyChanged('id'),
        switchMap(() => this.refreshLabelsSets()),
      )
      .subscribe();
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

  private filterByKind(labels: LabelSets | null, kind: LabelSetKind): LabelSets | null {
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
  }

  refreshLabelsSets(): Observable<LabelSets> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getLabels()),
      tap((labels) => this._labelsSubject.next(labels)),
    );
  }

  saveLabelSet(setId: string, labelSet: LabelSet) {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.setLabelSet(setId, labelSet)));
  }

  deleteLabelSet(setId: string) {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.deleteLabelSet(setId)));
  }
}
