import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { AnswerOperation, RetrievalAgent, Session } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { catchError, map, Observable, switchMap, take, tap, throwError } from 'rxjs';
import { testAgentAddAnswer, testAgentRun, testAgentStop } from '../../workflow.state';

const TEST_SESSION_SLUG_PREFIX = 'test-session';

@Injectable({
  providedIn: 'root',
})
export class TestPanelService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private currentSessionId?: string;

  getTestSessions(): Observable<Session[]> {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.listSessions(0, 100)),
      map((data) => data.sessions.filter((session) => session.slug?.startsWith(TEST_SESSION_SLUG_PREFIX))),
    );
  }

  private getOrCreateSession(
    sessionId: string,
    question: string,
  ): Observable<{ sessionId: string; arag: RetrievalAgent }> {
    if (sessionId === 'new') {
      // Create the session
      const smallHash = (Math.random() + 1).toString(36).substring(7);
      return this.sdk.currentArag.pipe(
        take(1),
        switchMap((arag) =>
          arag
            .createSession({
              name: question,
              slug: `${TEST_SESSION_SLUG_PREFIX}-${smallHash}`,
              data: '',
              summary: `Testing retrieval agent ${arag.title}.`,
              format: 'PLAIN',
            })
            .pipe(
              map((response) => ({ sessionId: response.uuid, arag })),
              catchError((error) => {
                this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.session-creation-error');
                testAgentStop();
                return throwError(() => error);
              }),
            ),
        ),
      );
    } else {
      return this.sdk.currentArag.pipe(
        take(1),
        switchMap((arag) => arag.getSession(sessionId).pipe(map((session) => ({ sessionId: session.id, arag })))),
      );
    }
  }

  runTest(
    question: string,
    userSessionId: string,
    useWS = true,
    fromCursor?: number,
    headers?: { [key: string]: string },
  ) {
    // update the state and keep the existing answers only when a cursor is provided
    testAgentRun(question, typeof fromCursor === 'number');

    this.getOrCreateSession(userSessionId, question)
      .pipe(
        tap(({ sessionId }) => (this.currentSessionId = sessionId)),
        switchMap(({ sessionId, arag }) => arag.interact(sessionId, question, useWS ? 'WS' : 'POST', headers)),
      )
      .subscribe({
        next: (data) => {
          if (data.type === 'answer') {
            const message = data.answer;
            if (message.operation === AnswerOperation.answer) {
              testAgentAddAnswer(message);
            } else if (message.operation === AnswerOperation.done || message.operation === AnswerOperation.error) {
              testAgentStop();
              if (message.operation === AnswerOperation.error) {
                this.toaster.error(
                  message.exception?.detail || 'retrieval-agents.workflow.sidebar.test.toasts.exception-unknown',
                );
              }
            }
          } else {
            this.toaster.error(data.detail || 'retrieval-agents.workflow.sidebar.test.toasts.exception-unknown');
            testAgentStop();
          }
        },
        error: () => {
          this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.exception-unknown');
          testAgentStop();
        },
      });
  }

  stopTest() {
    if (this.currentSessionId) {
      const sessionId = this.currentSessionId;
      this.sdk.currentArag
        .pipe(
          take(1),
          map((arag) => arag.stopInteraction(sessionId)),
        )
        .subscribe(() => testAgentStop());
    }
  }
}
