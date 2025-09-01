import { Injectable } from '@angular/core';
import { LabelsService, md5, NavigationService, NotificationService, SDKService } from '@flaps/core';
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
  Subject,
  switchMap,
  take,
  timer,
  toArray,
} from 'rxjs';
import { debounceTime, delay, tap } from 'rxjs/operators';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { PENDING_RESOURCES_LIMIT } from './upload.utils';
import SparkMD5 from 'spark-md5';

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
  private _statusCount: BehaviorSubject<{ processed: number; pending: number; error: number }> = new BehaviorSubject({
    processed: 0,
    pending: 0,
    error: 0,
  });

  progress = this._progress.asObservable();
  barDisabled = this._barDisabled.asObservable();
  statusCount = this._statusCount.asObservable();
  pendingResourcesLimitExceeded = this._statusCount.pipe(map((count) => count.pending > PENDING_RESOURCES_LIMIT));
  private _refreshNeeded = new Subject<boolean>();
  refreshNeeded = this._refreshNeeded.asObservable();

  constructor(
    private sdk: SDKService,
    private labelsService: LabelsService,
    private toaster: SisToastService,
    private modal: SisModalService,
    private translate: TranslateService,
    private notificationsService: NotificationService,
  ) {
    this.notificationsService.hasNewResourceOperationNotifications
      .pipe(
        debounceTime(2000),
        switchMap(() => this.updateAfterUploads()),
      )
      .subscribe();
  }

  checkFileTypesAndConfirm(files: File[]): Observable<boolean> {
    const spreadsheets = files.filter((file) => SPREADSHEET_MIMES.includes(file.type));
    const archives = files.filter((file) => ARCHIVE_MIMES.includes(file.type));
    return (
      spreadsheets.length > 0
        ? this.modal.openConfirm({
            title: this.translate.instant('upload.warning-spreadsheet-title', { num: spreadsheets.length }),
            description: this.translate.instant('upload.warning-spreadsheets-description', {
              url: 'https://docs.nuclia.dev/docs/ingestion/indexing#structured-text',
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
          this.uploadFiles(files, (progress) => {
            if (progress.completed) {
              if (progress.failed === 0 || progress.failed === progress.conflicts) {
                this.onUploadComplete(
                  true,
                  false,
                  false,
                  (progress.conflicts || 0) > 0,
                  (progress.conflicts || 0) < progress.files.length,
                );
              } else if (!hasNotifiedError) {
                hasNotifiedError = true;
                this.onUploadComplete(
                  false,
                  (progress.limitExceeded || 0) > 0,
                  (progress.blocked || 0) > 0,
                  (progress.conflicts || 0) > 0,
                );
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

  uploadFiles(files: File[], onUploadCompletion?: (progress: UploadStatus) => void): Observable<UploadStatus> {
    return forkJoin(files.map((file) => md5(file))).pipe(
      switchMap((fileList) =>
        this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            kb.batchUpload(fileList).pipe(
              tap((progress) => {
                if (typeof onUploadCompletion === 'function') {
                  onUploadCompletion(progress);
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

  createLinkResource(
    uri: string,
    classifications: Classification[],
    css_selector?: string | null,
    xpath?: string | null,
    headers?: { [id: string]: string },
    cookies?: { [id: string]: string },
    localstorage?: { [id: string]: string },
    extract_strategy?: string,
    split_strategy?: string,
    language?: string,
  ) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.createLinkResource(
          {
            uri,
            css_selector: css_selector || null,
            xpath: xpath || null,
            headers,
            cookies,
            localstorage,
            extract_strategy,
            split_strategy,
            language,
          },
          { classifications },
          true,
          { url: uri },
          SparkMD5.hash(uri),
        ),
      ),
    );
  }

  createCloudFileResource(
    uri: string,
    classifications: Classification[],
    extract_strategy?: string,
    split_strategy?: string,
    language?: string,
  ) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.createResource({
          title: uri,
          slug: SparkMD5.hash(uri),
          usermetadata: { classifications },
          files: {
            ['cloud-file']: {
              file: { uri },
              extract_strategy,
              split_strategy,
              language,
            },
          },
        }),
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
          .pipe(
            tap(() => this.onUploadComplete(true)),
            catchError((error) => {
              this.onUploadComplete(false, error?.status === 429);
              throw error;
            }),
          ),
      ),
    );
  }

  bulkUpload(uploads: Observable<any>[]): Observable<{ errors: number }> {
    let errors = 0;
    let errors429 = 0;
    let blocked = false;
    let conflicts = false;
    const avoidTabClosing = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', avoidTabClosing);
    uploads = uploads.map((upload) =>
      upload.pipe(
        // When there are many uploads, a delay is added to avoid overflowing the process queue
        delay(uploads.length > PENDING_RESOURCES_LIMIT ? 10000 : 0),
        catchError((error) => {
          errors += 1;
          if (error?.status === 429) {
            errors429 += 1;
          }
          if (error?.status === 402) {
            blocked = true;
          }
          if (error?.status === 409) {
            conflicts = true;
          }
          return of(null);
        }),
      ),
    );
    return from(uploads).pipe(
      mergeMap((obs) => obs, 6),
      toArray(),
      tap(() => {
        window.removeEventListener('beforeunload', avoidTabClosing);
        this.onUploadComplete(errors === 0, errors429 > 0, blocked, conflicts);
      }),
      map(() => ({ errors })),
    );
  }

  /**
   * Request the resource status facet on the current KB and returns corresponding search results.
   * Those results contain the facets in `fulltext` property,
   * but they also return the first page of resources the KB contains with their status and seqid.
   */
  getResourceStatusCount(includeResources = false): Observable<Search.Results> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.catalog('', {
          faceted: [STATUS_FACET],
          page_size: includeResources ? undefined : 0,
        }),
      ),
      filter((results) => results.type !== 'error' && !!results.fulltext?.facets),
      map((results) => results as Search.Results),
    );
  }

  updateStatusCount(): Observable<{ pending: number; error: number; processed: number }> {
    return this.getResourceStatusCount().pipe(
      map((results: Search.Results) => ({
        pending: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/PENDING`] || 0,
        error: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/ERROR`] || 0,
        processed: results.fulltext?.facets?.[STATUS_FACET]?.[`${STATUS_FACET}/PROCESSED`] || 0,
      })),
      tap((count) => {
        this._statusCount.next(count);
      }),
    );
  }

  onUploadComplete(
    success: boolean,
    limitExceeded = false,
    blocked = false,
    conflicts = false,
    showNotification = true,
  ) {
    if (showNotification) {
      success ? this.toaster.success('upload.toast.successful') : this.toaster.warning('upload.toast.failed');
    }
    if (blocked) {
      this.toaster.error('upload.toast.blocked');
    }
    if (limitExceeded) {
      this.toaster.error('upload.toast.limit');
    }
    if (conflicts) {
      this.toaster.error('upload.toast.conflicts');
    }
    if (success) {
      localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
    }
    timer(1000)
      .pipe(switchMap(() => this.updateAfterUploads()))
      .subscribe();
  }

  updateAfterUploads() {
    this._refreshNeeded.next(true);
    return this.updateStatusCount();
  }
}
