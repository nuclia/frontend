import { inject, Injectable } from '@angular/core';
import { STATUS_FACET, UploadService } from '@flaps/common';
import { NotificationService, SDKService, STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Ask,
  CatalogOptions,
  Classification,
  ConversationField,
  FIELD_TYPE,
  FileUploadStatus,
  Resource,
  ResourceProperties,
  UploadStatus,
} from '@nuclia/core';
import {
  BehaviorSubject,
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

export const HISTORY_LABEL: Classification = {
  labelset: 'cowork',
  label: 'history',
};
export const HISTORY_FIELD = 'history';
// Every catalog/count query on the resources table must exclude the "history" resources
// (used internally to store Q&A conversations), which are not real uploaded files.
export const EXCLUDE_HISTORY_FILTER: CatalogOptions['filter_expression'] = {
  resource: { not: { prop: 'label', ...HISTORY_LABEL } },
};

export const PAGE_SIZES = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

@Injectable({
  providedIn: 'root',
})
export class ContextBoxService {
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);

  uploadIndex = 0;
  uploadStatus = new BehaviorSubject<{ [index: number]: UploadStatus }>({});

  userId = this.sdk.nuclia.auth.getJWTUser()?.sub || '';

  visibleUploads = this.uploadStatus.pipe(
    map((uploads) =>
      Object.values(uploads)
        .reduce((acc, status) => acc.concat(status.files), [] as FileUploadStatus[])
        .filter((upload) => !upload.uploaded),
    ),
  );

  private _forceRefresh = new Subject<void>();
  refreshResources = merge(
    this.notificationService.hasNewResourceOperationNotifications,
    this.uploadStatus,
    this._forceRefresh,
  ).pipe(throttleTime(300, undefined, { leading: true, trailing: true }));

  // KB-wide status totals (used for the summary counters and the step-2-to-3 auto-advance),
  // computed with a facet-only query so it stays accurate regardless of which table page is shown.
  resourceCounter = this.refreshResources.pipe(
    switchMap(() => this.sdk.currentKb),
    switchMap((kb) =>
      kb.catalog('', {
        faceted: [STATUS_FACET],
        page_size: 0,
        filter_expression: EXCLUDE_HISTORY_FILTER,
      }),
    ),
    map((results) => {
      const facets = results.type === 'searchResults' ? results.fulltext?.facets?.[STATUS_FACET] : undefined;
      return {
        pending: facets?.[`${STATUS_FACET}/PENDING`] || 0,
        error: facets?.[`${STATUS_FACET}/ERROR`] || 0,
        processed: facets?.[`${STATUS_FACET}/PROCESSED`] || 0,
      };
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  forceRefresh() {
    this._forceRefresh.next();
  }

  uploadFiles(files: File[]) {
    this.cleanUploads();
    const uploadIndex = ++this.uploadIndex;
    this.uploadService
      .uploadFiles(files, (status) => {
        this.uploadStatus.next({ ...this.uploadStatus.getValue(), [uploadIndex]: status });
        this._forceRefresh.next();
      })
      .subscribe((status) => {
        this.uploadStatus.next({ ...this.uploadStatus.getValue(), [uploadIndex]: status });
      });
  }

  cleanUploads() {
    // Avoid the accumulation of upload errors. We only want to show the most recent ones.
    const current = this.uploadStatus.getValue();
    const newStatus = Object.fromEntries(Object.entries(current).filter(([, status]) => !status.completed));
    if (Object.keys(newStatus).length !== Object.keys(current).length) {
      this.uploadStatus.next(newStatus);
    }
  }

  createQuestion(
    title: string,
    question: string,
    answer: string,
    answerData?: Ask.Answer,
  ): Observable<{ uuid: string }> {
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
            content: {
              text: answer,
              format: 'MARKDOWN',
              attachments_fields: answerData
                ? [
                    {
                      field_type: FIELD_TYPE.text,
                      field_id: 'answer1',
                    },
                  ]
                : undefined,
            },
            type: 'ANSWER',
          },
        ],
      },
    };
    const { promptContext, ...answerDataToSave } = answerData || {}; // Exclude promptContext
    return this.sdk.currentKb.pipe(take(1)).pipe(
      switchMap((kb) =>
        kb.createResource({
          title,
          conversations,
          texts: answerData ? { answer1: { body: JSON.stringify(answerDataToSave), format: 'JSON' } } : undefined,
          usermetadata: { classifications: [HISTORY_LABEL] },
          security: {
            access_groups: [this.userId],
          },
        }),
      ),
    );
  }

  appendQuestion(resourceId: string, question: string, answer: string, answerData?: Ask.Answer) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        const resource = new Resource(this.sdk.nuclia, kb.id, { id: resourceId });
        return resource.getField(FIELD_TYPE.conversation, HISTORY_FIELD).pipe(
          switchMap((field) => {
            const index = (field.value as ConversationField).messages.length / 2 + 1;
            const { promptContext, ...answerDataToSave } = answerData || {}; // Exclude promptContext
            return (
              answerData
                ? resource.setField(FIELD_TYPE.text, `answer${index}`, {
                    body: JSON.stringify(answerDataToSave),
                    format: 'JSON',
                  })
                : of(undefined)
            ).pipe(
              switchMap(() =>
                resource.appendMessages(HISTORY_FIELD, [
                  {
                    ident: `question${index}`,
                    content: { text: question, format: 'PLAIN' },
                    type: 'QUESTION',
                  },
                  {
                    ident: `answer${index}`,
                    content: {
                      text: answer,
                      format: 'MARKDOWN',
                      attachments_fields: answerData
                        ? [
                            {
                              field_type: FIELD_TYPE.text,
                              field_id: `answer${index}`,
                            },
                          ]
                        : undefined,
                    },
                    type: 'ANSWER',
                  },
                ]),
              ),
            );
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

  getChatEntries(resourceId: string): Observable<Ask.Entry[]> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin([
          kb.getResource(resourceId, [ResourceProperties.VALUES]),
          new Resource(this.sdk.nuclia, kb.id, { id: resourceId }).getField(FIELD_TYPE.conversation, HISTORY_FIELD),
        ]),
      ),
      map(([resource, field]) => {
        const messages = (field.value as ConversationField).messages || [];
        return messages.reduce((acc, message) => {
          if (message.type === 'QUESTION') {
            acc.push({ question: message.content.text, answer: {} as Ask.Answer });
          } else if (message.type === 'ANSWER') {
            const answerData = resource.data.texts?.[message.ident]?.value?.body;
            let answerDataJSON: Ask.Answer | undefined;
            if (answerData) {
              try {
                answerDataJSON = JSON.parse(answerData);
              } catch (e) {
                console.error('Failed to parse answer data JSON', e);
              }
            }
            if (answerDataJSON) {
              acc[acc.length - 1].answer = answerDataJSON;
            } else {
              acc[acc.length - 1].answer = {
                type: 'answer',
                text: message.content.text,
                id: STFUtils.generateRandomSlugSuffix(),
                inError: !message.content.text,
                error: message.content.text ? undefined : this.translate.instant('context-box.failed'),
              };
            }
          }
          return acc;
        }, [] as Ask.Entry[]);
      }),
    );
  }
}
