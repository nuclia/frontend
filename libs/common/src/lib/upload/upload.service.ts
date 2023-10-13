import { Injectable } from '@angular/core';
import { md5, SDKService } from '@flaps/core';
import {
  Classification,
  ConversationField,
  FileWithMetadata,
  ICreateResource,
  LabelSet,
  LabelSetKind,
  Message,
  Search,
  TextFieldFormat,
  TextFormat,
  UploadStatus,
} from '@nuclia/core';
import { LabelsService } from '../label/labels.service';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  filter,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  startWith,
  switchMap,
  take,
  timer,
  toArray,
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { SisToastService } from '@nuclia/sistema';

export const UPLOAD_DONE_KEY = 'NUCLIA_UPLOAD_DONE';
export const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];
export const PATTERNS_TO_IGNORE = [/^~.+/, /.+\.tmp$/];
const REGEX_YOUTUBE_URL = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/)/;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private _progress = new ReplaySubject<UploadStatus>();
  private _barDisabled = new BehaviorSubject<boolean>(false);
  private _statusCount: BehaviorSubject<{ pending: number; error: number }> = new BehaviorSubject({
    pending: 0,
    error: 0,
  });

  progress = this._progress.asObservable();
  barDisabled = this._barDisabled.asObservable();
  statusCount = this._statusCount.asObservable();

  constructor(
    private sdk: SDKService,
    private labelsService: LabelsService,
    private toaster: SisToastService,
  ) {}

  uploadFiles(files: FileWithMetadata[]) {
    let hasNotifiedError = false;
    const labels = files
      .filter((file) => !!file.payload && !!file.payload.usermetadata && !!file.payload.usermetadata.classifications)
      .map((file) => file?.payload?.usermetadata?.classifications as Classification[])
      .reduce((acc, val) => acc.concat(val), [] as Classification[]);
    this.createMissingLabels(labels)
      .pipe(
        concatMap(() => forkJoin(files.map((file) => md5(file)))),
        switchMap((filelist) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              kb.batchUpload(filelist).pipe(
                tap((progress) => {
                  if (progress.completed) {
                    if (progress.failed === 0 || progress.failed === progress.conflicts) {
                      this.onUploadComplete(true, kb.id);
                    } else if (!hasNotifiedError) {
                      hasNotifiedError = true;
                      this.onUploadComplete(false, kb.id);
                    }
                  }
                }),
              ),
            ),
          ),
        ),
        startWith({ files: [], progress: 0, completed: false, uploaded: 0, failed: 0, conflicts: 0 }),
      )
      .subscribe((progress) => {
        this._progress.next(progress);
      });
    this._barDisabled.next(false);
  }

  disableBar() {
    this._barDisabled.next(true);
  }

  createMissingLabels(labels: Classification[]): Observable<void> {
    if (labels.length === 0) {
      return of(undefined);
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getLabels()),
      switchMap((existingLabels) => {
        const missingLabels = labels
          .filter(
            (label) =>
              !Object.entries(existingLabels).find(
                ([labelset, data]) => label.labelset === labelset && data.labels.find((l) => l.title === label.label),
              ),
          )
          .reduce(
            (acc, current) =>
              acc.find(({ labelset, label }) => current.labelset === labelset && current.label === label)
                ? acc
                : acc.concat([current]),
            [] as Classification[],
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
                  color: '#DAF3E6',
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
              switchMap(() => this.labelsService.refreshLabelsSets()),
              take(1),
            ),
          ),
        );
      }),
      map(() => {}),
    );
  }

  createLinkResource(uri: string, classifications: Classification[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.createLinkResource(
          { uri },
          { classifications },
          true,
          REGEX_YOUTUBE_URL.test(uri) ? undefined : { url: uri },
        ),
      ),
    );
  }

  uploadTextResource(title: string, body: string, format: TextFieldFormat, classifications?: Classification[]) {
    const resource: ICreateResource = {
      title: title,
      texts: {
        text: { body, format },
      },
    };
    if ((classifications || []).length > 0) {
      resource['usermetadata'] = {
        classifications: classifications,
      };
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.createResource(resource)),
      // onUploadSuccess is called only once for all by the parent
    );
  }

  uploadQnaResource(
    title: string,
    qna: string[][],
    questionFormat: TextFormat,
    answerFormat: TextFormat,
  ): Observable<{ uuid: string }> {
    const conversations: { qna: ConversationField } = {
      qna: {
        messages: qna.reduce((messages, row, currentIndex) => {
          if (row.length === 2) {
            messages = messages.concat([
              {
                ident: `question${currentIndex}`,
                content: { text: row[0], format: questionFormat },
                type: 'QUESTION',
              },
              {
                ident: `answer${currentIndex}`,
                content: { text: row[1], format: answerFormat },
                type: 'ANSWER',
              },
            ]);
          } else {
            console.warn(`Unexpected row length while uploading Q&A "${title}":`, row);
          }

          return messages;
        }, [] as Message[]),
      },
    };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .createResource({
            title,
            conversations,
          })
          .pipe(tap(() => this.onUploadComplete(true, kb.id))),
      ),
    );
  }

  bulkUpload(uploads: Observable<any>[]): Observable<{ errors: number }> {
    let errors = 0;
    uploads = uploads.map((upload) =>
      upload.pipe(
        catchError(() => {
          errors += 1;
          return of(null);
        }),
      ),
    );
    return from(uploads).pipe(
      mergeMap((obs) => obs, 6),
      toArray(),
      switchMap(() => this.sdk.currentKb.pipe(take(1))),
      tap((kb) => {
        this.onUploadComplete(errors === 0, kb.id);
      }),
      map(() => ({ errors })),
    );
  }

  updateStatusCount(): Observable<{ pending: number; error: number; processed: number }> {
    const statusFacet = '/n/s';
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.catalog('', {
          faceted: [statusFacet],
        }),
      ),
      filter((results) => results.type !== 'error' && !!results.fulltext?.facets),
      map((results) => results as Search.Results),
      map((results: Search.Results) => ({
        pending: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/PENDING`] || 0,
        error: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/ERROR`] || 0,
        processed: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/PROCESSED`] || 0,
      })),
      tap((count) => {
        this._statusCount.next({ pending: count.pending, error: count.error });
      }),
    );
  }

  onUploadComplete(success: boolean, kbId: string) {
    if (success) {
      this.toaster.success('upload.toast.successful');
      this.setUploadDone(kbId);
    } else {
      this.toaster.warning('upload.toast.failed');
    }
    timer(1000)
      .pipe(switchMap(() => this.updateStatusCount()))
      .subscribe();
  }

  hasKbGotData(kbId: string) {
    return JSON.parse(localStorage.getItem(UPLOAD_DONE_KEY) || '{}')[kbId] === 'true';
  }

  private setUploadDone(kbId: string) {
    const currentState = JSON.parse(localStorage.getItem(UPLOAD_DONE_KEY) || '{}');
    currentState[kbId] = 'true';
    localStorage.setItem(UPLOAD_DONE_KEY, JSON.stringify(currentState));
  }
}
