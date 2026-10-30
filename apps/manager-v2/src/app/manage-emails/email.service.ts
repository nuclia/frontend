import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { catchError, concatMap, from, Observable, of, scan } from 'rxjs';
import { BroadcastEmailRequest, BroadcastEmailResponse, BroadcastProgress } from './email.models';

const EMAIL_ENDPOINT = '/manage/email';
// The backend sends emails sequentially within the request, so large lists are split in batches.
export const EMAIL_BATCH_SIZE = 100;

export function getEmailErrorMessage(error: unknown): string {
  const detail = (error as { body?: { detail?: unknown } })?.body?.detail;
  return typeof detail === 'string' && detail ? detail : 'Unexpected error, please try again.';
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private sdk = inject(SDKService);

  sendEmail(payload: BroadcastEmailRequest): Observable<BroadcastEmailResponse> {
    return this.sdk.nuclia.rest.post<BroadcastEmailResponse>(EMAIL_ENDPOINT, payload);
  }

  sendTestEmail(subject: string, bodyContent: string, senderName?: string): Observable<BroadcastEmailResponse> {
    return this.sendEmail({
      user_ids: [],
      subject,
      body_content: bodyContent,
      ...(senderName ? { sender_name: senderName } : {}),
      is_dry_run: true,
    });
  }

  /** Emits the cumulative progress after each batch; a failing batch is reported as failed recipients. */
  sendToUsers(
    userIds: string[],
    subject: string,
    bodyContent: string,
    senderName?: string,
  ): Observable<BroadcastProgress> {
    const batches: string[][] = [];
    for (let i = 0; i < userIds.length; i += EMAIL_BATCH_SIZE) {
      batches.push(userIds.slice(i, i + EMAIL_BATCH_SIZE));
    }

    return from(batches).pipe(
      concatMap((batch) =>
        this.sendEmail({
          user_ids: batch,
          subject,
          body_content: bodyContent,
          ...(senderName ? { sender_name: senderName } : {}),
          is_dry_run: false,
        }).pipe(
          catchError((error) =>
            of<BroadcastEmailResponse>({
              dry_run: false,
              requested_count: batch.length,
              queued_count: 0,
              failed_count: batch.length,
              queued_user_ids: [],
              failed: batch.map((user_id) => ({ user_id, error: getEmailErrorMessage(error) })),
            }),
          ),
        ),
      ),
      scan(
        (progress, response): BroadcastProgress => ({
          ...progress,
          queued: progress.queued + response.queued_count,
          failed: [...progress.failed, ...response.failed],
        }),
        { requested: userIds.length, queued: 0, failed: [] } as BroadcastProgress,
      ),
    );
  }
}
