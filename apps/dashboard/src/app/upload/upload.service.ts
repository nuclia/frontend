import { Injectable } from '@angular/core';
import { SDKService, md5 } from '@flaps/core';
import { FileWithMetadata, LabelSet, LabelSetKind, LabelValue, UploadStatus } from '@nuclia/core';
import {
  forkJoin,
  startWith,
  Subject,
  BehaviorSubject,
  switchMap,
  tap,
  take,
  Observable,
  map,
  of,
  switchMapTo,
  concatMap,
  concatMapTo,
  combineLatest,
} from 'rxjs';

export const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];

@Injectable({ providedIn: 'root' })
export class UploadService {
  private _progress = new Subject<UploadStatus>();
  progress = this._progress.asObservable();

  private _barDisabled = new BehaviorSubject<boolean>(false);
  barDisabled = this._barDisabled.asObservable();

  constructor(private sdk: SDKService) {}

  uploadFiles(files: FileWithMetadata[]) {
    const labels = files
      .filter((file) => !!file.payload && !!file.payload.usermetadata && !!file.payload.usermetadata.classifications)
      .map((file) => file?.payload?.usermetadata?.classifications as LabelValue[])
      .reduce((acc, val) => acc.concat(val), [] as LabelValue[]);
    this.createMissingLabels(labels)
      .pipe(
        concatMapTo(forkJoin(files.map((file) => md5(file)))),
        switchMap((filelist) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.batchUpload(filelist)),
          ),
        ),
        startWith({ files: [], progress: 0, completed: false, uploaded: 0, failed: 0, conflicts: 0 }),
        tap((progress) => {
          if (progress.completed) {
            this.sdk.refreshCounter();
          }
        }),
      )
      .subscribe((progress) => {
        this._progress.next(progress);
      });
    this._barDisabled.next(false);
  }

  disableBar() {
    this._barDisabled.next(true);
  }

  private createMissingLabels(labels: LabelValue[]): Observable<void> {
    if (labels.length === 0) {
      return of(undefined);
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getLabels()),
      switchMap((existingLabels) => {
        const missingLabels = labels.filter(
          (label) =>
            !Object.entries(existingLabels).find(
              ([labelset, data]) => label.labelset === labelset && data.labels.find((l) => l.title === label.label),
            ),
        );
        if (missingLabels.length === 0) {
          return of(undefined);
        }
        const labelSets: { [id: string]: LabelSet } = {};
        missingLabels.forEach((missingLabel) => {
          if (!labelSets[missingLabel.labelset]) {
            labelSets[missingLabel.labelset] = existingLabels[missingLabel.labelset]
              ? {
                  ...existingLabels[missingLabel.labelset],
                  labels: [...existingLabels[missingLabel.labelset].labels, { title: missingLabel.label }],
                }
              : {
                  title: missingLabel.labelset,
                  color: '#000000',
                  multiple: true,
                  kind: [LabelSetKind.RESOURCES],
                  labels: [{ title: missingLabel.label }],
                };
          } else {
            labelSets[missingLabel.labelset].labels.push({ title: missingLabel.label });
          }
        });
        return combineLatest(
          Object.entries(labelSets).map(([id, labelSet]) =>
            this.sdk.currentKb.pipe(
              switchMap((kb) => kb.setLabelSet(id, labelSet)),
              take(1),
            ),
          ),
        );
      }),
      map(() => {}),
    );
  }
}
