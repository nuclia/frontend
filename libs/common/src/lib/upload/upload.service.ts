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
  ProcessingStatusResponse,
  Resource,
  Search,
  TextFieldFormat,
  TextFormat,
  UploadStatus,
  WritableKnowledgeBox,
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
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';

const REGEX_YOUTUBE_URL = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/)/;
export const SPREADSHEET_MIMES = [
  'text/csv',
  'application/json',
  'text/xml',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];
export const ARCHIVE_MIMES = [
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
  'application/x-rar',
];
export const STATUS_FACET = '/metadata.status';

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
    private modal: SisModalService,
    private translate: TranslateService,
  ) {}

  checkFileTypesAndConfirm(files: File[]): Observable<boolean> {
    const spreadsheets = files.filter((file) => SPREADSHEET_MIMES.includes(file.type));
    const archives = files.filter((file) => ARCHIVE_MIMES.includes(file.type));
    return (
      spreadsheets.length > 0
        ? this.modal.openConfirm({
            title: this.translate.instant('upload.warning-spreadsheet-title', { num: spreadsheets.length }),
            description: this.translate.instant('upload.warning-spreadsheets-description', {
              url: 'https://docs.nuclia.dev/docs/guides/using/indexing/#structured-text',
            }),
            confirmLabel: 'generic.upload',
          }).onClose
        : of(true)
    ).pipe(
      filter((res) => !!res),
      switchMap(() =>
        archives.length > 0
          ? this.modal.openConfirm({
              title: this.translate.instant('upload.warning-archive-title', { num: archives.length }),
              description: 'upload.warning-archive-description',
              confirmLabel: 'generic.upload',
            }).onClose
          : of(true),
      ),
      filter((res) => !!res),
    );
  }

  uploadFilesAndManageCompletion(files: FileWithMetadata[]) {
    let hasNotifiedError = false;
    const labels = files
      .filter((file) => !!file.payload && !!file.payload.usermetadata && !!file.payload.usermetadata.classifications)
      .map((file) => file?.payload?.usermetadata?.classifications as Classification[])
      .reduce((acc, val) => acc.concat(val), [] as Classification[]);
    this.createMissingLabels(labels)
      .pipe(
        concatMap(() =>
          this.uploadFiles(files, (kb, progress) => {
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
        startWith({ files: [], progress: 0, completed: false, uploaded: 0, failed: 0, conflicts: 0 }),
      )
      .subscribe((progress) => {
        this._progress.next(progress);
      });
    this._barDisabled.next(false);
  }

  uploadFiles(
    files: File[],
    onUploadCompletion?: (kb: WritableKnowledgeBox, progress: UploadStatus) => void,
  ): Observable<UploadStatus> {
    return forkJoin(files.map((file) => md5(file))).pipe(
      switchMap((fileList) =>
        this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            kb.batchUpload(fileList).pipe(
              tap((progress) => {
                if (typeof onUploadCompletion === 'function') {
                  onUploadCompletion(kb, progress);
                }
              }),
            ),
          ),
        ),
      ),
    );
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

  /**
   * Request the resource status facet on the current KB and returns corresponding search results.
   * Those results contain the facets in `fulltext` property,
   * but they also return the first page of resources the KB contains with their status and seqid.
   */
  getResourceStatusCount(): Observable<Search.Results> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.catalog('', {
          faceted: [STATUS_FACET],
        }),
      ),
      filter((results) => results.type !== 'error' && !!results.fulltext?.facets),
      map((results) => results as Search.Results),
    );
  }

  getResourcePlaceInProcessingQueue(resource: Resource, processingStatus: ProcessingStatusResponse): number | null {
    if (!processingStatus || !resource.last_account_seq) {
      return null;
    }
    const last_delivered_seqid =
      resource.queue === 'private'
        ? processingStatus.account?.last_delivered_seqid
        : processingStatus.shared?.last_delivered_seqid;
    return typeof last_delivered_seqid === 'number'
      ? resource.last_account_seq - last_delivered_seqid
      : resource.last_account_seq - 1;
  }

  updateStatusCount(): Observable<{ pending: number; error: number; processed: number }> {
    return this.getResourceStatusCount().pipe(
      map((results: Search.Results) => ({
        pending: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/PENDING`] || 0,
        error: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/ERROR`] || 0,
        processed: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/PROCESSED`] || 0,
      })),
      tap((count) => {
        this._statusCount.next({ pending: count.pending, error: count.error });
      }),
    );
  }

  onUploadComplete(success: boolean, kbId: string) {
    if (success) {
      this.toaster.success('upload.toast.successful');
      localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
    } else {
      this.toaster.warning('upload.toast.failed');
    }
    timer(1000)
      .pipe(switchMap(() => this.updateStatusCount()))
      .subscribe();
  }
}
