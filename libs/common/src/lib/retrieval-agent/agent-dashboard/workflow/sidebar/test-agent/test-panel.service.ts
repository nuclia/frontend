import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { AnswerOperation, InteractionOperation, RetrievalAgent, Session } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { map, Observable, switchMap, take } from 'rxjs';
import {
  testAgentAddAnswer,
  testAgentHasAllAnswers,
  testAgentLastAnswer,
  testAgentRun,
  testAgentStop,
  testAgentUpdateResults,
} from '../../workflow.state';

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

  runTest(question: string, sessionId: string, useWS = true, fromCursor?: number) {
    // update the state and keep the existing answers only when a cursor is provided
    testAgentRun(question, typeof fromCursor === 'number');
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
        next: (wsUrl) => this.openWebSocket(wsUrl, question, sessionId),
        error: () => {
          this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.session-creation-error');
          testAgentStop();
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
            testAgentUpdateResults(data);
            const lastMessage = data[data.length - 1];
            if (lastMessage.operation === AnswerOperation.done || lastMessage.operation === AnswerOperation.error) {
              testAgentStop();
            }
          },
          error: () => {
            this.toaster.error('retrieval-agents.workflow.sidebar.test.toasts.session-creation-error');
            testAgentStop();
          },
        });
    }
  }

  stopTest() {
    this.closeWsConnection();
  }

  private openWebSocket(wsUrl: string, question: string, sessionId: string) {
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
        testAgentAddAnswer(data);
        if (data.operation === AnswerOperation.done || data.operation === AnswerOperation.error) {
          ws.close(1000);
          testAgentStop();
        }
      }
    };
    ws.onerror = (error) => {
      console.debug('Error: ', error);
      testAgentStop();
    };

    ws.onclose = (event) => {
      // When close status is not a normal one, we check we got all the answers
      if (event.code === 1000 || testAgentHasAllAnswers()) {
        testAgentStop();
      } else {
        // If not we reopen a connection from the last seqId
        const lastSeqId = testAgentLastAnswer().seqid;
        if (lastSeqId !== null) {
          this.runTest(question, sessionId, true, lastSeqId + 1);
        } else {
          testAgentStop();
        }
      }
    };
  }

  private closeWsConnection() {
    if (!this.currentWs) {
      console.error('No current WebSocket stored');
      return;
    }
    this.currentWs.send(JSON.stringify({ question: '', operation: InteractionOperation.quit }));
    this.currentWs.close(1000);
  }
}
