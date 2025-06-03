import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { AnswerOperation, InteractionOperation, RetrievalAgent, Session } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { map, Observable, switchMap, take } from 'rxjs';
import { addAnswer, runTest, stopTest, updateTestResults } from '../../workflow.state';

const TEST_SESSION_SLUG_PREFIX = 'test-session';

@Injectable({
  providedIn: 'root',
})
export class TestPanelService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private currentWs?: WebSocket;

  getTestSessions(): Observable<Session[]> {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.listSessions(0, 100)),
      map((data) => data.sessions.filter((session) => session.slug?.startsWith(TEST_SESSION_SLUG_PREFIX))),
    );
  }

  runTest(question: string, sessionId: string, useWS = true) {
    // update the state
    runTest(question);
    let sessionRequest: Observable<{ sessionId: string; arag: RetrievalAgent }>;
    if (sessionId === 'new') {
      // Create the session
      const smallHash = (Math.random() + 1).toString(36).substring(7);
      sessionRequest = this.sdk.currentArag.pipe(
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
            .pipe(map((response) => ({ sessionId: response.uuid, arag }))),
        ),
      );
    } else {
      sessionRequest = this.sdk.currentArag.pipe(
        take(1),
        switchMap((arag) => arag.getSession(sessionId).pipe(map((session) => ({ sessionId: session.id, arag })))),
      );
    }

    if (useWS) {
      sessionRequest.pipe(switchMap(({ sessionId, arag }) => arag.getWsUrl(sessionId))).subscribe({
        next: (wsUrl) => {
          // Open the websocket connection
          const ws = new WebSocket(wsUrl);
          this.currentWs = ws;
          ws.onopen = () => {
            const message = { question, operation: InteractionOperation.question };
            // and send the question
            ws.send(JSON.stringify(message));
          };
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data) {
              // Update the state
              addAnswer(data);
              if (data.operation === AnswerOperation.done || data.operation === AnswerOperation.error) {
                ws.close();
                stopTest();
              }
            }
          };
          ws.onerror = (error) => {
            console.debug('Error: ', error);
            stopTest();
          };

          ws.onclose = (event) => {
            console.debug('Closed: ' + event.code + ' ' + event.reason);
            stopTest();
          };
        },
        error: () => {
          this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.session-creation-error');
          stopTest();
        },
      });
    } else {
      sessionRequest
        .pipe(
          // Use POST interaction
          switchMap(({ sessionId, arag }) => arag.interaction(sessionId, question)),
        )
        .subscribe({
          next: (data) => {
            updateTestResults(data);
            const lastMessage = data[data.length - 1];
            if (lastMessage.operation === AnswerOperation.done || lastMessage.operation === AnswerOperation.error) {
              stopTest();
            }
          },
          error: () => {
            this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.session-creation-error');
            stopTest();
          },
        });
    }
  }

  stopTest() {
    if (!this.currentWs) {
      console.error('No current WebSocket stored');
      return;
    }
    this.currentWs.send(JSON.stringify({ question: '', operation: InteractionOperation.quit }));
    this.currentWs.close();
  }
}
