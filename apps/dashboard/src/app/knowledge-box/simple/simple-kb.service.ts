import { inject, Injectable } from '@angular/core';
import { UploadService } from '@flaps/common';
import { NotificationService, SDKService, UserService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Classification,
  ConversationField,
  FIELD_TYPE,
  FileUploadStatus,
  IResource,
  Message,
  Resource,
  RESOURCE_STATUS,
  Search,
  SortField,
  UploadStatus,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  throttleTime,
} from 'rxjs';

const HISTORY_LABEL: Classification = {
  labelset: 'cowork',
  label: 'history',
};
const HISTORY_FIELD = 'history';

export interface ConversationsPage {
  items: { messages: Message[]; resource: IResource }[];
  hasMore: boolean;
}

type rankedResource = IResource & { rank?: number };

@Injectable({
  providedIn: 'root',
})
export class SimpleKBService {
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);

  maxFiles = 200;

  uploadStatus = new BehaviorSubject<UploadStatus>({
    files: [],
    progress: 0,
    completed: false,
    uploaded: 0,
    failed: 0,
  });

  userName = this.userService.userPrefs.pipe(map((userPrefs) => userPrefs?.name || ''));
  visibleUploads = this.uploadStatus.pipe(map((uploads) => uploads.files.filter((upload) => !upload.uploaded)));
  uploadInProgress = this.visibleUploads.pipe(
    map((uploads) => uploads.filter((upload) => !this.isUploadFailed(upload)).length > 0),
  );

  private _forceRefresh = new Subject<void>();
  refreshResources = merge(
    merge(this.notificationService.hasNewResourceOperationNotifications, this.uploadStatus, this._forceRefresh).pipe(
      throttleTime(300, undefined, { leading: true, trailing: true }),
    ),
  );

  resources: Observable<rankedResource[]> = combineLatest([this.sdk.currentKb, this.refreshResources]).pipe(
    switchMap(([kb]) =>
      kb.catalog('', {
        page_number: 0,
        page_size: this.maxFiles,
        filter_expression: {
          resource: {
            not: { prop: 'label', ...HISTORY_LABEL },
          },
        },
        sort: { field: SortField.created, order: 'desc' },
      }),
    ),
    map((res) => (res.type === 'error' ? [] : Object.values(res.resources || {}))),
    switchMap((resources) => {
      if (resources.some((resource) => resource.metadata?.status === RESOURCE_STATUS.PENDING)) {
        return this.getResourcesWithRank(resources);
      } else {
        return of(resources);
      }
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  resourceCounter = this.resources.pipe(
    map((resources) => ({
      pending: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.PENDING).length,
      error: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.ERROR).length,
      processed: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.PROCESSED).length,
    })),
  );

  forceRefresh() {
    this._forceRefresh.next();
  }

  uploadFiles(files: File[]) {
    this.resources.pipe(take(1)).subscribe((resources) => {
      if (resources.length + files.length > this.maxFiles) {
        this.toaster.error(this.translate.instant('simple.file-limit', { num: this.maxFiles }));
        return;
      }
      this.uploadService
        .uploadFiles(files, (status) => {
          this.uploadStatus.next(status);
          this._forceRefresh.next();
        })
        .subscribe((status) => {
          this.uploadStatus.next(status);
        });
    });
  }

  isUploadFailed(upload: FileUploadStatus): boolean {
    return upload.failed || !!upload.blocked || !!upload.conflicts || !!upload.limitExceeded;
  }

  getResourcesWithRank(resources: IResource[]): Observable<rankedResource[]> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.processingStatus(undefined, undefined, this.maxFiles)),
      map((processingStatus) =>
        processingStatus.results
          .filter((status) => status.schedule_order !== -1)
          .reduce((resources, status) => {
            const index = resources.findIndex((resource) => resource.id === status.resource_id);
            if (index > -1) {
              resources[index] = { ...resources[index], rank: status.schedule_order };
            }
            return resources;
          }, resources as rankedResource[])
          .sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : 0)),
      ),
    );
  }

  getConversationsPage(page = 0): Observable<ConversationsPage> {
    const pageSize = 40;
    return forkJoin([this.sdk.currentKb.pipe(take(1)), this.userName.pipe(take(1))]).pipe(
      switchMap(([kb, userName]) =>
        kb
          .search('', [Search.Features.FULLTEXT], {
            top_k: pageSize,
            offset: page * pageSize,
            security: { groups: [userName] },
            filter_expression: {
              field: { prop: 'label', ...HISTORY_LABEL },
            },
            sort: { field: SortField.created, order: 'desc' },
          })
          .pipe(
            map((result) => {
              if (result.type === 'error') {
                throw new Error('Error fetching messages');
              }
              return result;
            }),
            switchMap((result) => {
              const resources = Object.values(result.resources || {});
              const hasMore = (result.fulltext?.total || 0) > (page + 1) * pageSize;
              if (resources.length === 0) {
                return of({ items: [], hasMore: false });
              }
              return forkJoin(
                resources.map((resource) =>
                  new Resource(this.sdk.nuclia, kb.id, { id: resource.id })
                    .getField(FIELD_TYPE.conversation, HISTORY_FIELD)
                    .pipe(
                      map((field) => ({
                        resource,
                        messages: (field.value as ConversationField).messages,
                      })),
                    ),
                ),
              ).pipe(map((items) => ({ items, hasMore })));
            }),
          ),
      ),
    );
  }

  createQuestion(title: string, question: string, answer: string): Observable<{ uuid: string }> {
    const conversations: { [HISTORY_FIELD]: ConversationField } = {
      [HISTORY_FIELD]: {
        messages: [
          {
            ident: `question1`,
            content: { text: question, format: 'PLAIN' },
            type: 'QUESTION',
          },
          {
            ident: `answer1`,
            content: { text: answer, format: 'MARKDOWN' },
            type: 'ANSWER',
          },
        ],
      },
    };
    return forkJoin([this.sdk.currentKb.pipe(take(1)), this.userName.pipe(take(1))]).pipe(
      switchMap(([kb, userName]) =>
        kb.createResource({
          title,
          conversations,
          usermetadata: { classifications: [HISTORY_LABEL] },
          security: {
            access_groups: [userName],
          },
        }),
      ),
    );
  }

  appendQuestion(resourceId: string, question: string, answer: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        const resource = new Resource(this.sdk.nuclia, kb.id, { id: resourceId });
        return resource.getField(FIELD_TYPE.conversation, HISTORY_FIELD).pipe(
          switchMap((field) => {
            const index = (field.value as ConversationField).messages.length / 2 + 1;
            return resource.appendMessages(HISTORY_FIELD, [
              {
                ident: `question${index}`,
                content: { text: question, format: 'PLAIN' },
                type: 'QUESTION',
              },
              {
                ident: `answer${index}`,
                content: { text: answer, format: 'MARKDOWN' },
                type: 'ANSWER',
              },
            ]);
          }),
        );
      }),
    );
  }

  deleteQuestion(resourceId: string, questionIdent: string, answerIdent: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        const resource = new Resource(this.sdk.nuclia, kb.id, { id: resourceId });
        return resource.getField(FIELD_TYPE.conversation, HISTORY_FIELD).pipe(
          map((field) => (field.value as ConversationField).messages || []),
          switchMap((messages) => {
            const newMessages = messages.filter(
              (message) => message.ident !== questionIdent && message.ident !== answerIdent,
            );
            return newMessages.length > 0
              ? resource.setField(FIELD_TYPE.conversation, HISTORY_FIELD, { messages: newMessages })
              : resource.delete();
          }),
        );
      }),
    );
  }
}
