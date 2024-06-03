import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaExpanderModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '../../../api';
import { concatMap, forkJoin, map, Observable, of, shareReplay, switchMap, take, toArray } from 'rxjs';
import { LabelsService } from '../../labels.service';
import { LABEL_MAIN_COLORS } from '../utils';
import {
  getLabelFromFilter,
  getLabelSetFromFilter,
  Label,
  LABEL_FILTER_PREFIX,
  LabelSet,
  LabelSetKind,
} from '@nuclia/core';

@Component({
  templateUrl: './missing-labels-dialog.component.html',
  styleUrl: './missing-labels-dialog.component.scss',
  standalone: true,
  imports: [PaModalModule, TranslateModule, CommonModule, PaButtonModule, PaExpanderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingLabelsDialogComponent {
  private _allLabels: Observable<{ [labelSet: string]: string[] }> = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) =>
      kb.catalog('', { faceted: [`/${LABEL_FILTER_PREFIX}`] }).pipe(
        switchMap((results) => {
          if (results.type === 'error') throw 'Error';
          const facets = Object.keys(results.fulltext?.facets?.[`/${LABEL_FILTER_PREFIX}`] || {});
          return facets.length === 0
            ? of({})
            : kb.catalog('', { faceted: facets }).pipe(
                map((results) => {
                  if (results.type === 'error') throw 'Error';
                  return Object.entries(results.fulltext?.facets || {}).reduce(
                    (acc, [labelSet, labels]) => {
                      acc[getLabelSetFromFilter(labelSet)] = Object.keys(labels).map(
                        (label) => getLabelFromFilter(label).label,
                      );
                      return acc;
                    },
                    {} as { [labelSet: string]: string[] },
                  );
                }),
              );
        }),
      ),
    ),
  );
  missingLabels = forkJoin([this._allLabels, this.labelsService.labelSets.pipe(take(1))]).pipe(
    map(([allLabels, declaredLabels]) => {
      return Object.entries(allLabels).reduce(
        (acc, [labelSet, labels]) => {
          const missing = labels.filter(
            (label) => !(declaredLabels?.[labelSet]?.labels?.map((label) => label.title) || []).includes(label),
          );
          if (missing.length > 0) {
            acc[labelSet] = { title: declaredLabels?.[labelSet]?.title || labelSet, labels: missing };
          }
          return acc;
        },
        {} as { [labelSet: string]: { title: string; labels: string[] } },
      );
    }),
    shareReplay(1),
  );
  hasMissingLabels = this.missingLabels.pipe(map((missing) => Object.keys(missing).length > 0));

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private labelsService: LabelsService,
  ) {}

  declare() {
    forkJoin([this.missingLabels.pipe(take(1)), this.labelsService.labelSets.pipe(take(1))])
      .pipe(
        map(([missingLabels, declaredLabels]) => {
          return Object.entries(missingLabels).map(([labelSet, data]) => {
            const declaredLabelSet = declaredLabels?.[labelSet];
            const missing: Label[] = data.labels.map((title) => ({ title }));
            const payload: LabelSet = declaredLabelSet
              ? {
                  ...declaredLabelSet,
                  labels: [...declaredLabelSet.labels, ...missing],
                }
              : {
                  title: labelSet,
                  color: LABEL_MAIN_COLORS[0],
                  multiple: true,
                  kind: [LabelSetKind.RESOURCES],
                  labels: missing,
                };
            return this.labelsService.saveLabelSet(labelSet, payload);
          });
        }),
        switchMap((observables) =>
          // NOTE: the backend does not support creating label sets in parallel
          of(...observables).pipe(
            concatMap((obs) => obs),
            toArray(),
          ),
        ),
        switchMap(() => this.labelsService.refreshLabelsSets()),
      )
      .subscribe(() => {
        this.modal.close();
      });
  }
}
